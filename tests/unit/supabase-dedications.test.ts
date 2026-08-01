import { ZodError } from 'zod';

import { ensureSupabaseUser, getCurrentSupabaseUser } from '@/lib/supabase/auth';
import { requireSupabaseClient, type AtharSupabaseClient } from '@/lib/supabase/client';
import type { DedicationRow } from '@/lib/supabase/database.types';
import {
  createDedication,
  getOwnedDedication,
  getPublicDedication,
  updateOwnedDedication,
} from '@/lib/supabase/dedications';
import type { DedicationDraft } from '@/types/dedication';

jest.mock('@/lib/supabase/auth', () => ({
  ensureSupabaseUser: jest.fn(),
  getCurrentSupabaseUser: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  requireSupabaseClient: jest.fn(),
}));

const mockedEnsureSupabaseUser = jest.mocked(ensureSupabaseUser);
const mockedGetCurrentSupabaseUser = jest.mocked(getCurrentSupabaseUser);
const mockedRequireSupabaseClient = jest.mocked(requireSupabaseClient);

const slug = 'd_0123456789abcdef0123456789abcdef';
const draft: DedicationDraft = {
  recipientName: '  فاطمة ومحمد  ',
  recipientStatus: 'alive',
  giverName: '  عبد الله  ',
  message: '  رسالة محبة  ',
  themeKey: 'emerald',
};
const row: DedicationRow = {
  id: '20000000-0000-4000-8000-000000000001',
  slug,
  recipient_name: 'فاطمة ومحمد',
  recipient_status: 'alive',
  giver_name: 'عبد الله',
  message: 'رسالة محبة',
  theme_key: 'emerald',
  visibility: 'unlisted',
  created_by: '10000000-0000-4000-8000-000000000001',
  is_active: true,
  created_at: '2026-08-02T00:00:00.000Z',
  updated_at: '2026-08-02T00:00:00.000Z',
};

describe('Supabase dedication service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates with Zod before accessing authentication or the database', async () => {
    await expect(
      createDedication({
        ...draft,
        recipientName: '',
        message: '<script>alert(1)</script>',
      }),
    ).rejects.toBeInstanceOf(ZodError);

    expect(mockedRequireSupabaseClient).not.toHaveBeenCalled();
    expect(mockedEnsureSupabaseUser).not.toHaveBeenCalled();
  });

  it('creates an authenticated remote row and lets the database own identity fields', async () => {
    const single = jest.fn().mockResolvedValue({ data: row, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    const from = jest.fn().mockReturnValue({ insert });
    const client = { from } as unknown as AtharSupabaseClient;
    mockedRequireSupabaseClient.mockReturnValue(client);
    mockedEnsureSupabaseUser.mockResolvedValue({ id: row.created_by } as never);

    const created = await createDedication(draft);

    expect(mockedEnsureSupabaseUser).toHaveBeenCalledWith(client);
    expect(from).toHaveBeenCalledWith('dedications');
    expect(insert).toHaveBeenCalledWith({
      recipient_name: 'فاطمة ومحمد',
      recipient_status: 'alive',
      giver_name: 'عبد الله',
      message: 'رسالة محبة',
      theme_key: 'emerald',
    });
    expect(select).toHaveBeenCalledWith('*');
    expect(single).toHaveBeenCalledTimes(1);
    expect(created.slug).toBe(slug);
    expect(created.slug).not.toMatch(/^local-/u);
  });

  it('performs public reads only through the exact-slug RPC', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const rpc = jest.fn().mockReturnValue({ maybeSingle });
    const from = jest.fn();
    mockedRequireSupabaseClient.mockReturnValue({ rpc, from } as unknown as AtharSupabaseClient);

    const dedication = await getPublicDedication(slug);

    expect(rpc).toHaveBeenCalledWith('get_public_dedication', { p_slug: slug });
    expect(maybeSingle).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
    expect(dedication?.recipientStatus).toBe('alive');
  });

  it('does not create an anonymous session for a read-only ownership check', async () => {
    const from = jest.fn();
    const client = { from } as unknown as AtharSupabaseClient;
    mockedRequireSupabaseClient.mockReturnValue(client);
    mockedGetCurrentSupabaseUser.mockResolvedValue(null);

    await expect(getOwnedDedication(slug)).resolves.toBeNull();

    expect(mockedGetCurrentSupabaseUser).toHaveBeenCalledWith(client);
    expect(mockedEnsureSupabaseUser).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('scopes owner updates to both the public slug and the current user id', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const select = jest.fn().mockReturnValue({ maybeSingle });
    const ownerEq = jest.fn().mockReturnValue({ select });
    const slugEq = jest.fn().mockReturnValue({ eq: ownerEq });
    const update = jest.fn().mockReturnValue({ eq: slugEq });
    const from = jest.fn().mockReturnValue({ update });
    const client = { from } as unknown as AtharSupabaseClient;
    const otherUserId = '10000000-0000-4000-8000-000000000002';
    mockedRequireSupabaseClient.mockReturnValue(client);
    mockedGetCurrentSupabaseUser.mockResolvedValue({ id: otherUserId } as never);

    await expect(updateOwnedDedication(slug, { message: 'رسالة أخرى' })).resolves.toBeNull();

    expect(slugEq).toHaveBeenCalledWith('slug', slug);
    expect(ownerEq).toHaveBeenCalledWith('created_by', otherUserId);
    expect(select).toHaveBeenCalledWith('*');
  });

  it('treats an inactive dedication hidden by the public RPC as unavailable', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const rpc = jest.fn().mockReturnValue({ maybeSingle });
    mockedRequireSupabaseClient.mockReturnValue({ rpc } as unknown as AtharSupabaseClient);

    await expect(getPublicDedication(slug)).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledWith('get_public_dedication', { p_slug: slug });
  });
});
