import type { PublicDedication } from '@/types/dedication';

/** This route key is local-only and is intentionally rejected by backend APIs. */
export const DEMO_DEDICATION_SLUG = 'demo-mahmoud-wahida';

export const DEMO_DEDICATION: PublicDedication = {
  slug: DEMO_DEDICATION_SLUG,
  recipientName: 'محمود ووحيدة المصري',
  recipientStatus: 'deceased',
  giverName: 'أيمن وحاتم المصري',
  message:
    'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
  themeKey: 'emerald',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const DEMO_DEDICATION_TITLE = 'إهداء إلى روح والدينا';
export const DEMO_DEDICATION_GIVER_LABEL = `من ابنيكما: ${DEMO_DEDICATION.giverName}`;
export const DEMO_MUSHAF_TITLE = `مصحفٌ مهديّ إلى روح ${DEMO_DEDICATION.recipientName}`;
