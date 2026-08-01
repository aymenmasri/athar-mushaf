import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createLocalDedication,
  getOwnedLocalDedication,
  getPublishedDedicationSlug,
} from '@/lib/dedication/local-repository';
import { publishLocalDedication } from '@/lib/dedication/publish-local';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { createDedication } from '@/lib/supabase/dedications';
import type { Dedication, DedicationDraft } from '@/types/dedication';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '12345678-1234-4234-8234-123456789abc'),
}));

jest.mock('@/lib/supabase/dedications', () => ({
  createDedication: jest.fn(),
}));

const REMOTE_SLUG = 'd_0123456789abcdef0123456789abcdef';
const draft: DedicationDraft = {
  recipientName: 'مريم العلي',
  giverName: 'سليم العلي',
  message: 'رسالة خاصة للاختبار.',
  recipientStatus: 'alive',
  themeKey: 'emerald',
};

function remoteDedication(overrides: Partial<Dedication> = {}): Dedication {
  return {
    ...draft,
    id: '20000000-0000-4000-8000-000000000001',
    slug: REMOTE_SLUG,
    visibility: 'unlisted',
    isActive: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('publishLocalDedication', () => {
  const mockedCreateDedication = jest.mocked(createDedication);

  beforeEach(() => {
    mockedCreateDedication.mockReset();
  });

  it('publishes remotely, saves the replacement mapping, then removes the local copy', async () => {
    const local = await createLocalDedication(draft);
    const remote = remoteDedication();
    mockedCreateDedication.mockResolvedValue(remote);

    await expect(publishLocalDedication(local)).resolves.toEqual(remote);

    expect(mockedCreateDedication).toHaveBeenCalledTimes(1);
    expect(mockedCreateDedication).toHaveBeenCalledWith(draft);
    await expect(getPublishedDedicationSlug(local.slug)).resolves.toBe(REMOTE_SLUG);
    await expect(getOwnedLocalDedication(local.slug)).resolves.toBeNull();
  });

  it('keeps the local copy and writes no mapping when remote publication fails', async () => {
    const local = await createLocalDedication(draft);
    mockedCreateDedication.mockRejectedValue(new Error('remote insert failed'));

    await expect(publishLocalDedication(local)).rejects.toThrow('remote insert failed');

    await expect(getOwnedLocalDedication(local.slug)).resolves.toMatchObject({
      slug: local.slug,
      recipientName: draft.recipientName,
    });
    await expect(getPublishedDedicationSlug(local.slug)).resolves.toBeNull();
  });

  it('normalizes a legacy living dedication to alive before publishing it', async () => {
    const legacy = {
      ...remoteDedication({
        id: 'local-id',
        slug: 'local-legacy-dedication',
      }),
      recipientStatus: 'living',
    } as unknown as Dedication;
    await AsyncStorage.setItem(STORAGE_KEYS.dedications, JSON.stringify([legacy]));
    mockedCreateDedication.mockResolvedValue(remoteDedication());

    await publishLocalDedication(legacy);

    expect(mockedCreateDedication).toHaveBeenCalledWith({
      recipientName: legacy.recipientName,
      recipientStatus: 'alive',
      giverName: legacy.giverName,
      message: legacy.message,
      themeKey: legacy.themeKey,
    });
    await expect(getPublishedDedicationSlug(legacy.slug)).resolves.toBe(REMOTE_SLUG);
    await expect(getOwnedLocalDedication(legacy.slug)).resolves.toBeNull();
  });
});
