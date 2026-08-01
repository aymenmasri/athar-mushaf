import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { Dedication, DedicationDraft, DedicationUpdate } from '@/types/dedication';

function makeSlug(): string {
  return `local-${Crypto.randomUUID().replaceAll('-', '')}`;
}

async function readAll(): Promise<Dedication[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.dedications);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Dedication[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Dedication[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.dedications, JSON.stringify(items));
}

export async function createLocalDedication(draft: DedicationDraft): Promise<Dedication> {
  const now = new Date().toISOString();
  const dedication: Dedication = {
    ...draft,
    id: Crypto.randomUUID(),
    slug: makeSlug(),
    visibility: 'unlisted',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const current = await readAll();
  await writeAll([dedication, ...current]);
  return dedication;
}

export async function getLocalDedication(slug: string): Promise<Dedication | null> {
  const current = await readAll();
  return current.find((item) => item.slug === slug && item.isActive) ?? null;
}

export async function getOwnedLocalDedication(slug: string): Promise<Dedication | null> {
  const current = await readAll();
  return current.find((item) => item.slug === slug) ?? null;
}

export async function updateLocalDedication(
  slug: string,
  update: DedicationUpdate,
): Promise<Dedication | null> {
  const current = await readAll();
  const index = current.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const previous = current[index];
  if (!previous) return null;
  const next: Dedication = {
    ...previous,
    ...(update.giverName === undefined ? {} : { giverName: update.giverName.trim() }),
    ...(update.message === undefined ? {} : { message: update.message.trim() }),
    ...(update.themeKey === undefined ? {} : { themeKey: update.themeKey }),
    ...(update.isActive === undefined ? {} : { isActive: update.isActive }),
    updatedAt: new Date().toISOString(),
  };
  current[index] = next;
  await writeAll(current);
  return next;
}

export async function deleteLocalDedication(slug: string): Promise<boolean> {
  const current = await readAll();
  const next = current.filter((item) => item.slug !== slug);
  if (next.length === current.length) return false;
  await writeAll(next);
  return true;
}
