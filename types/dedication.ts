export const RECIPIENT_STATUSES = ['alive', 'deceased', 'unspecified'] as const;

export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

export const DEDICATION_VISIBILITIES = ['unlisted'] as const;

export type DedicationVisibility = (typeof DEDICATION_VISIBILITIES)[number];

export const DEDICATION_LIMITS = {
  recipientName: 120,
  giverName: 120,
  message: 600,
  themeKey: 32,
} as const;

export type DedicationDraft = {
  recipientName: string;
  recipientStatus: RecipientStatus;
  giverName: string;
  message: string;
  themeKey: string;
};

/**
 * The creator-only representation. `id` is an internal database identifier and
 * must never be used in a public URL or rendered on the public dedication page.
 */
export type Dedication = DedicationDraft & {
  id: string;
  slug: string;
  visibility: DedicationVisibility;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Fields intentionally returned by the exact-slug public lookup RPC. */
export type PublicDedication = DedicationDraft & {
  slug: string;
  createdAt: string;
};

export type DedicationUpdate = Partial<
  Pick<DedicationDraft, 'giverName' | 'message' | 'themeKey'> & {
    isActive: boolean;
  }
>;
