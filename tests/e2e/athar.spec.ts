import { expect, test } from '@playwright/test';

import { FakeSupabase } from './support/fake-supabase';

test('publishes the Arabic social metadata and preview image', async ({ page }) => {
  const title = 'أثر — مصحفٌ يبقى لمن تحب';
  const description = 'أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور.';
  const imageUrl = 'https://athar-mushaf.expo.app/og-athar.png';

  await page.goto('/');
  await expect(page).toHaveTitle(title);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    description,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', imageUrl);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  const preview = await page.request.get('/og-athar.png');
  expect(preview.ok()).toBe(true);
  expect(preview.headers()['content-type']).toBe('image/png');
});

test('publishes remotely and opens the dedication in an independent browser', async ({
  browser,
}) => {
  const baseURL = test.info().project.use.baseURL as string;
  const supabase = new FakeSupabase();
  const creatorContext = await browser.newContext({ baseURL, locale: 'ar' });
  const readerContext = await browser.newContext({ baseURL, locale: 'ar' });

  await supabase.attach(creatorContext, 'creator');
  await supabase.attach(readerContext, 'reader');

  try {
    const creatorPage = await creatorContext.newPage();
    await creatorPage.goto('/');
    await expect(creatorPage.getByText('أثر', { exact: true }).first()).toBeVisible();
    await creatorPage.getByRole('button', { name: 'أنشئ إهداءً' }).click();
    await creatorPage.getByLabel('اسم المُهدى إليه').fill('مريم العلي');
    await creatorPage.getByLabel('اسم صاحب الإهداء').fill('سليم العلي');
    await creatorPage.getByLabel('رسالة الإهداء').fill('كلمة محبة تبقى أثرًا جميلًا.');
    await creatorPage.getByRole('checkbox').click();
    await creatorPage.getByRole('button', { name: 'معاينة الإهداء' }).click();
    await expect(creatorPage.getByText('إهداء إلى مريم العلي')).toBeVisible();
    await creatorPage.getByRole('button', { name: 'نشر الإهداء' }).click();
    await expect(creatorPage).toHaveURL(/\/dedication\/d_[0-9a-f]{32}\/?$/u);
    expect(supabase.signInCount('creator')).toBe(1);

    const publishedUrl = creatorPage.url();
    expect(publishedUrl).not.toContain('local-');

    const readerPage = await readerContext.newPage();
    await readerPage.goto(publishedUrl);
    await expect(readerPage.getByText('إهداء إلى مريم العلي', { exact: true })).toBeVisible();
    await expect(readerPage.getByText('من سليم العلي', { exact: true })).toBeVisible();
    await expect(
      readerPage.getByText('كلمة محبة تبقى أثرًا جميلًا.', { exact: true }),
    ).toBeVisible();
    expect(supabase.signInCount('reader')).toBe(0);
  } finally {
    await creatorContext.close();
    await readerContext.close();
  }
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
