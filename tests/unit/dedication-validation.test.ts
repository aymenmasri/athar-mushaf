import { dedicationFormSchema, sanitizeUserText } from '@/lib/validation/dedication';

const valid = {
  recipientName: 'محمود ووحيدة المصري',
  giverName: 'أيمن وحاتم المصري',
  message:
    'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
  recipientStatus: 'deceased' as const,
  themeKey: 'emerald' as const,
  visibility: 'unlisted' as const,
  confirmed: true,
};

describe('dedication form validation', () => {
  it('accepts and trims safe Arabic content', () => {
    expect(
      dedicationFormSchema.parse({ ...valid, recipientName: '  محمود المصري  ' }).recipientName,
    ).toBe('محمود المصري');
  });

  it('rejects empty required fields and missing confirmation', () => {
    expect(
      dedicationFormSchema.safeParse({ ...valid, recipientName: '', confirmed: false }).success,
    ).toBe(false);
  });

  it.each(['https://example.com', 'www.example.com', 'example.com'])(
    'rejects URLs in names: %s',
    (recipientName) => {
      expect(dedicationFormSchema.safeParse({ ...valid, recipientName }).success).toBe(false);
    },
  );

  it.each(['<script>alert(1)</script>', '<b>رسالة</b>', 'javascript:alert(1)'])(
    'rejects markup or script-like content: %s',
    (message) => {
      expect(dedicationFormSchema.safeParse({ ...valid, message }).success).toBe(false);
    },
  );

  it('enforces field limits without damaging Arabic characters', () => {
    expect(dedicationFormSchema.safeParse({ ...valid, message: 'ا'.repeat(601) }).success).toBe(
      false,
    );
    expect(sanitizeUserText('  أَثَرٌ\u0000  ')).toBe('أَثَرٌ');
  });
});
