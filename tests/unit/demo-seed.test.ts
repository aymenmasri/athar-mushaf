import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seed = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8');

describe('Supabase local demo seed', () => {
  it('uses the corrected memorial dedication', () => {
    expect(seed).toContain("'محمود ووحيدة المصري'");
    expect(seed).toContain("'deceased'");
    expect(seed).toContain("'أيمن وحاتم المصري'");
    expect(seed).toContain(
      "'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.'",
    );
  });

  it('contains no former health or longevity prayer', () => {
    expect(seed).not.toMatch(/إلى والديّ|حفظكما|أدام عليكما|الصحة|العافية/u);
  });
});
