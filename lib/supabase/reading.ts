import { ensureSupabaseUser } from '@/lib/supabase/auth';
import { requireSupabaseClient } from '@/lib/supabase/client';
import type { BookmarkRow, Json, ReadingProgressRow } from '@/lib/supabase/database.types';

export type ReadingProgressSnapshot = {
  lastSurahNumber: number | null;
  lastAyahNumber: number | null;
  lastJuzNumber: number | null;
  completedSections: Json[];
  updatedAt?: string;
};

export type SyncedBookmark = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  createdAt: string;
};

function toProgress(row: ReadingProgressRow): ReadingProgressSnapshot {
  return {
    lastSurahNumber: row.last_surah_number,
    lastAyahNumber: row.last_ayah_number,
    lastJuzNumber: row.last_juz_number,
    completedSections: Array.isArray(row.completed_sections) ? row.completed_sections : [],
    updatedAt: row.updated_at,
  };
}

function toBookmark(row: BookmarkRow): SyncedBookmark {
  return {
    id: row.id,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    createdAt: row.created_at,
  };
}

export async function getSyncedReadingProgress(): Promise<ReadingProgressSnapshot | null> {
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id)
    .is('dedication_id', null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProgress(data) : null;
}

export async function saveSyncedReadingProgress(
  snapshot: ReadingProgressSnapshot,
): Promise<ReadingProgressSnapshot> {
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const values = {
    last_surah_number: snapshot.lastSurahNumber,
    last_ayah_number: snapshot.lastAyahNumber,
    last_juz_number: snapshot.lastJuzNumber,
    completed_sections: snapshot.completedSections,
  };

  const { data: existing, error: lookupError } = await client
    .from('reading_progress')
    .select('id')
    .eq('user_id', user.id)
    .is('dedication_id', null)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const request = existing
    ? client.from('reading_progress').update(values).eq('id', existing.id).eq('user_id', user.id)
    : client.from('reading_progress').insert(values);

  const { data, error } = await request.select('*').single();

  if (error) {
    // A concurrent first save can win the partial unique-index race. Retry as
    // an update without ever broadening access beyond the current RLS user.
    if (!existing && error.code === '23505') {
      return saveSyncedReadingProgress(snapshot);
    }

    throw error;
  }

  return toProgress(data);
}

export async function listSyncedBookmarks(): Promise<SyncedBookmark[]> {
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(toBookmark);
}

export async function addSyncedBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
  const client = requireSupabaseClient();
  await ensureSupabaseUser(client);
  const { error } = await client.from('bookmarks').insert({
    surah_number: surahNumber,
    ayah_number: ayahNumber,
  });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function removeSyncedBookmark(
  surahNumber: number,
  ayahNumber: number,
): Promise<boolean> {
  const client = requireSupabaseClient();
  const user = await ensureSupabaseUser(client);
  const { data, error } = await client
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('surah_number', surahNumber)
    .eq('ayah_number', ayahNumber)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}
