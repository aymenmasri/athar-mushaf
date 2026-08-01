import { ensureSupabaseUser, getCurrentSupabaseUser } from '@/lib/supabase/auth';
import { requireSupabaseClient } from '@/lib/supabase/client';
import type { DedicationRow, PublicDedicationRow } from '@/lib/supabase/database.types';
import { assertValidDedicationSlug } from '@/lib/supabase/slug';
import { dedicationDraftSchema } from '@/lib/validation/dedication';
import type {
  Dedication,
  DedicationDraft,
  DedicationUpdate,
  PublicDedication,
} from '@/types/dedication';

function toDedication(row: DedicationRow): Dedication {
  return {
    id: row.id,
    slug: row.slug,
    recipientName: row.recipient_name,
    recipientStatus: row.recipient_status,
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
    recipientStatus: row.recipient_status,
    giverName: row.giver_name,
    message: row.message,
    themeKey: row.theme_key,
    createdAt: row.created_at,
  };
}

export async function createDedication(draft: DedicationDraft): Promise<Dedication> {
  const cleaned = dedicationDraftSchema.parse(draft);
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);

  // The database deliberately owns slug, created_by, visibility and is_active:
  // its trigger/defaults bind them to cryptographic randomness and auth.uid(),
  // while column grants prevent a client from spoofing those identity fields.
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
  if (data.created_by !== user.id) {
    throw new Error('تعذّر التحقق من ملكية الإهداء المنشور.');
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
  const user = await getCurrentSupabaseUser(client);
  if (!user) {
    return null;
  }

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
  const user = await getCurrentSupabaseUser(client);
  if (!user) {
    return [];
  }

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
  const user = await getCurrentSupabaseUser(client);
  if (!user) {
    return null;
  }

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
  const user = await getCurrentSupabaseUser(client);
  if (!user) {
    return false;
  }

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
