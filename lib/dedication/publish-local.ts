import {
  deleteLocalDedication,
  getOwnedLocalDedication,
  savePublishedDedicationMapping,
} from '@/lib/dedication/local-repository';
import { createDedication } from '@/lib/supabase/dedications';
import { isValidDedicationSlug } from '@/lib/supabase/slug';
import type { Dedication, DedicationDraft, RecipientStatus } from '@/types/dedication';

type LegacyRecipientStatus = RecipientStatus | 'living';

function normalizeRecipientStatus(status: LegacyRecipientStatus): RecipientStatus {
  return status === 'living' ? 'alive' : status;
}

/**
 * Publishes an existing device-only dedication and only removes the local copy
 * after Supabase has returned a valid public slug and the replacement mapping
 * has been persisted.
 */
export async function publishLocalDedication(localDedication: Dedication): Promise<Dedication> {
  if (!localDedication.slug.startsWith('local-')) {
    throw new TypeError('Only a local dedication can be published with this function.');
  }

  const stored = await getOwnedLocalDedication(localDedication.slug);
  if (!stored) {
    throw new Error('تعذّر العثور على الإهداء المحفوظ على هذا الجهاز.');
  }

  const draft: DedicationDraft = {
    recipientName: stored.recipientName,
    recipientStatus: normalizeRecipientStatus(stored.recipientStatus as LegacyRecipientStatus),
    giverName: stored.giverName,
    message: stored.message,
    themeKey: stored.themeKey,
  };
  const published = await createDedication(draft);

  if (!isValidDedicationSlug(published.slug) || published.slug.startsWith('local-')) {
    throw new Error('تعذّر تأكيد الرابط العام الذي أعاده الخادم.');
  }

  await savePublishedDedicationMapping(stored.slug, published.slug);
  await deleteLocalDedication(stored.slug);
  return published;
}
