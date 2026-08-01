import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TITLE = 'أثر — مصحفٌ يبقى لمن تحب';
const DESCRIPTION = 'أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور.';
const SITE_URL = 'https://athar-mushaf.expo.app/';
const IMAGE_URL = `${SITE_URL}og-athar.png`;

const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')) as {
  expo: {
    icon: string;
    web: Record<string, unknown>;
  };
};
const html = readFileSync(resolve(process.cwd(), 'public/index.html'), 'utf8');

function readPngDimensions(path: string) {
  const image = readFileSync(resolve(process.cwd(), path));
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

describe('Web identity and social preview', () => {
  it('uses the dedicated icon and favicon in Expo config', () => {
    expect(appConfig.expo.icon).toBe('./assets/images/icon.png');
    expect(appConfig.expo.web).toMatchObject({
      name: 'أثر',
      shortName: 'أثر',
      favicon: './assets/images/favicon.png',
      output: 'single',
      lang: 'ar',
      dir: 'rtl',
    });
  });

  it('ships PNG assets at the required dimensions', () => {
    expect(readPngDimensions('assets/images/icon.png')).toEqual({ width: 1024, height: 1024 });
    expect(readPngDimensions('assets/images/favicon.png')).toEqual({ width: 512, height: 512 });
    expect(readPngDimensions('public/og-athar.png')).toEqual({ width: 1200, height: 630 });
  });

  it('defines canonical Open Graph and Twitter metadata in the SPA template', () => {
    for (const value of [
      `<title>${TITLE}</title>`,
      `name="description"`,
      `content="${DESCRIPTION}"`,
      `rel="canonical" href="${SITE_URL}"`,
      `property="og:title" content="${TITLE}"`,
      `property="og:description"`,
      `property="og:url" content="${SITE_URL}"`,
      `property="og:image" content="${IMAGE_URL}"`,
      `property="og:image:width" content="1200"`,
      `property="og:image:height" content="630"`,
      `name="twitter:card" content="summary_large_image"`,
      `name="twitter:image" content="${IMAGE_URL}"`,
    ]) {
      expect(html).toContain(value);
    }

    expect(html).toContain('<html lang="%LANG_ISO_CODE%" dir="rtl">');
    expect(html).toContain('<div id="root"></div>');
  });
});
