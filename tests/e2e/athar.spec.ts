import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('creates and previews a local dedication', async ({ page }) => {
  await expect(page.getByText('أثر', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'أنشئ إهداءً' }).click();
  await page.getByLabel('اسم المُهدى إليه').fill('مريم العلي');
  await page.getByLabel('اسم صاحب الإهداء').fill('سليم العلي');
  await page.getByLabel('رسالة الإهداء').fill('كلمة محبة تبقى أثرًا جميلًا.');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'معاينة الإهداء' }).click();
  await expect(page.getByText('إهداء إلى مريم العلي')).toBeVisible();
  await page.getByRole('button', { name: 'تأكيد الإهداء' }).click();
  await expect(page).toHaveURL(/\/dedication\/local-/u);
  await expect(page.getByText('كلمة محبة تبقى أثرًا جميلًا.')).toBeVisible();
});

test('finds Al-Ikhlas and persists an ayah bookmark', async ({ page }) => {
  await page.goto('/quran');
  await page.getByLabel('ابحث باسم السورة أو رقمها').fill('الإخلاص');
  await page.getByRole('link', { name: /سورة الإخلاص/u }).click();
  await page.getByRole('button', { name: 'إضافة الآية إلى المفضلة' }).first().click();
  await page.goto('/quran/bookmarks');
  await expect(page.getByText('سورة الإخلاص').first()).toBeVisible();
});

test('restores the last reading position after reload', async ({ page }) => {
  await page.goto('/quran/surah/1');
  await page.getByRole('button', { name: 'حفظ موضع القراءة عند الآية 1' }).click();
  await page.reload();
  await page.goto('/');
  await expect(page.getByText('تابع القراءة')).toBeVisible();
  await expect(page.getByText(/السورة 1 · الآية 1/u)).toBeVisible();
});

test('opens the public demo dedication and starts reading', async ({ page }) => {
  await page.goto('/dedication/demo-mahmoud-wahida');
  await expect(page.getByText('إهداء إلى روح والدينا')).toBeVisible();
  await expect(page.getByText('محمود ووحيدة المصري', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText('من ابنيكما: أيمن وحاتم المصري')).toBeVisible();
  await expect(page.getByText('مصحفٌ مهديّ إلى روح محمود ووحيدة المصري')).toBeVisible();
  await page.getByRole('button', { name: 'ابدأ القراءة' }).click();
  await expect(page).toHaveURL(/\/quran\/?$/u);
  await expect(page.getByText('اقرأ على مهل')).toBeVisible();
});

test('loads Quran display text by surah instead of on the home page', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (path.includes('/_expo/static/js/web/')) scripts.push(path.split('/').at(-1) ?? path);
  });

  await page.goto('/');
  await expect(page.getByText('مصحفٌ يبقى', { exact: false }).first()).toBeVisible();
  expect(scripts.some((name) => /^\d{3}-.*[.]js$/u.test(name))).toBe(false);
  expect(scripts.some((name) => /^search-index-.*[.]js$/u.test(name))).toBe(false);

  await page.goto('/quran/surah/112');
  await expect(page.getByText('سورة الإخلاص', { exact: true })).toBeVisible();
  expect(scripts.some((name) => /^112-.*[.]js$/u.test(name))).toBe(true);
  expect(scripts.some((name) => /^002-.*[.]js$/u.test(name))).toBe(false);
});
