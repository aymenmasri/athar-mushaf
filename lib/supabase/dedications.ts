import { ensureSupabaseUser } from '@/lib/supabase/auth';
import { requireSupabaseClient } from '@/lib/supabase/client';
import type { DedicationRow, PublicDedicationRow } from '@/lib/supabase/database.types';
import { assertValidDedicationSlug } from '@/lib/supabase/slug';
import type {
  Dedication,
  DedicationDraft,
  DedicationUpdate,
  PublicDedication,
  RecipientStatus,
} from '@/types/dedication';

function toDedication(row: DedicationRow): Dedication {
  return {
    id: row.id,
    slug: row.slug,
    recipientName: row.recipient_name,
    recipientStatus: row.recipient_status as RecipientStatus,
    giverName: row.giver_name,
    message: row.message,
    themeKey: row.theme_key,
    visibility: 'unlisted',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicDedication(row: PublicDedicationRow): PublicDedication {
  return {
    slug: row.slug,
    recipientName: row.recipient_name,
    recipientStatus: row.recipient_status as RecipientStatus,
    giverName: row.giver_name,
    message: row.message,
    themeKey: row.theme_key,
    createdAt: row.created_at,
  };
}

function cleanDraft(draft: DedicationDraft): DedicationDraft {
  return {
    ...draft,
    recipientName: draft.recipientName.trim(),
    giverName: draft.giverName.trim(),
    message: draft.message.trim(),
    themeKey: draft.themeKey.trim(),
  };
}

export async function createDedication(draft: DedicationDraft): Promise<Dedication> {
  const client = requireSupabaseClient();
  await ensureSupabaseUser(client);

  const cleaned = cleanDraft(draft);
  const { data, error } = await client
    .from('dedications')
    .insert({
      recipient_name: cleaned.recipientName,
      recipient_status: cleaned.recipientStatus,
      giver_name: cleaned.giverName,
      message: cleaned.message,
      theme_key: cleaned.themeKey,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return toDedication(data);
}

/** Public lookup deliberately uses the exact-slug RPC, never a table SELECT. */
export async function getPublicDedication(slug: string): Promise<PublicDedication | null> {
  assertValidDedicationSlug(slug);

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('get_public_dedication', { p_slug: slug }).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toPublicDedication(data) : null;
}

export async function getOwnedDedication(slug: string): Promise<Dedication | null> {
  assertValidDedicationSlug(slug);

  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('dedications')
    .select('*')
    .eq('slug', slug)
    .eq('created_by', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toDedication(data) : null;
}

export async function listOwnedDedications(): Promise<Dedication[]> {
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('dedications')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(toDedication);
}

export async function updateOwnedDedication(
  slug: string,
  update: DedicationUpdate,
): Promise<Dedication | null> {
  assertValidDedicationSlug(slug);

  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const payload = {
    ...(update.giverName === undefined ? {} : { giver_name: update.giverName.trim() }),
    ...(update.message === undefined ? {} : { message: update.message.trim() }),
    ...(update.themeKey === undefined ? {} : { theme_key: update.themeKey.trim() }),
    ...(update.isActive === undefined ? {} : { is_active: update.isActive }),
  };

  if (Object.keys(payload).length === 0) {
    return getOwnedDedication(slug);
  }

  const { data, error } = await client
    .from('dedications')
    .update(payload)
    .eq('slug', slug)
    .eq('created_by', user.id)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toDedication(data) : null;
}

export async function deleteOwnedDedication(slug: string): Promise<boolean> {
  assertValidDedicationSlug(slug);

  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('dedications')
    .delete()
    .eq('slug', slug)
    .eq('created_by', user.id)
    .select('slug')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}
