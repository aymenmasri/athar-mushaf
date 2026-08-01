import { z } from 'zod';

import { DEDICATION_LIMITS, RECIPIENT_STATUSES } from '@/types/dedication';

const containsUrl = /(?:https?:\/\/|www\.|[\w-]+\.(?:com|net|org|io|co|fr)(?:\b|\/))/iu;
const containsMarkup = /[<>]|(?:javascript\s*:)|(?:data\s*:\s*text\/html)/iu;
const unsafeControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu;

function cleanUserText(value: string): string {
  return value.replace(unsafeControlCharacters, '').trim();
}

const safeName = (label: string) =>
  z
    .string()
    .transform(cleanUserText)
    .pipe(
      z
        .string()
        .min(1, `${label} مطلوب`)
        .max(DEDICATION_LIMITS.recipientName, `${label} أطول من الحد المسموح`)
        .refine((value) => !containsUrl.test(value), 'لا يمكن وضع رابط في حقل الاسم')
        .refine((value) => !containsMarkup.test(value), 'الاسم يحتوي على رموز غير مسموحة'),
    );

export const dedicationDraftSchema = z.object({
  recipientName: safeName('اسم المُهدى إليه'),
  giverName: safeName('اسم صاحب الإهداء'),
  message: z
    .string()
    .transform(cleanUserText)
    .pipe(
      z
        .string()
        .min(1, 'رسالة الإهداء مطلوبة')
        .max(DEDICATION_LIMITS.message, 'الرسالة أطول من ٦٠٠ حرف')
        .refine((value) => !containsMarkup.test(value), 'الرسالة تحتوي على رموز غير مسموحة'),
    ),
  recipientStatus: z.enum(RECIPIENT_STATUSES),
  themeKey: z.enum(['emerald', 'indigo', 'clay']),
});

export const dedicationFormSchema = dedicationDraftSchema.extend({
  visibility: z.literal('unlisted'),
  confirmed: z.boolean().refine((value) => value, 'يجب تأكيد فهم خصوصية الرابط'),
});

export const dedicationManageSchema = z.object({
  giverName: safeName('اسم صاحب الإهداء'),
  message: z
    .string()
    .transform(cleanUserText)
    .pipe(
      z
        .string()
        .min(1, 'رسالة الإهداء مطلوبة')
        .max(DEDICATION_LIMITS.message, 'الرسالة أطول من ٦٠٠ حرف')
        .refine((value) => !containsMarkup.test(value), 'الرسالة تحتوي على رموز غير مسموحة'),
    ),
  themeKey: z.enum(['emerald', 'indigo', 'clay']),
});

export type DedicationFormValues = z.input<typeof dedicationFormSchema>;
export type ValidatedDedicationForm = z.output<typeof dedicationFormSchema>;

export function sanitizeUserText(value: string): string {
  return cleanUserText(value);
}
