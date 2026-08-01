import {
  DEMO_DEDICATION,
  DEMO_DEDICATION_GIVER_LABEL,
  DEMO_DEDICATION_SLUG,
  DEMO_DEDICATION_TITLE,
  DEMO_MUSHAF_TITLE,
  isSupabaseConfigured,
} from '@/lib/supabase';

describe('demo mode dedication', () => {
  it('keeps the required demo content local and exact', () => {
    expect(DEMO_DEDICATION_SLUG).toBe('demo-mahmoud-wahida');
    expect(DEMO_DEDICATION).toMatchObject({
      recipientName: 'محمود ووحيدة المصري',
      recipientStatus: 'deceased',
      giverName: 'أيمن وحاتم المصري',
      message:
        'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
    });
    expect(DEMO_DEDICATION_TITLE).toBe('إهداء إلى روح والدينا');
    expect(DEMO_DEDICATION_GIVER_LABEL).toBe('من ابنيكما: أيمن وحاتم المصري');
    expect(DEMO_MUSHAF_TITLE).toBe('مصحفٌ مهديّ إلى روح محمود ووحيدة المصري');
  });

  it('starts without Supabase variables in the test environment', () => {
    expect(isSupabaseConfigured).toBe(false);
  });
});
