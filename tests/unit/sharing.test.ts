import { DEFAULT_SHARE_TEXT, buildShareMessage, buildWhatsAppUrl } from '@/lib/sharing';

describe('sharing adapter', () => {
  const url = 'https://athar.example/dedication/d_abc';

  it('builds the sober Arabic share message followed by the public URL', () => {
    expect(buildShareMessage(url)).toBe(`${DEFAULT_SHARE_TEXT}\n${url}`);
  });

  it('encodes the complete message for WhatsApp', () => {
    const whatsapp = buildWhatsAppUrl(url);
    expect(whatsapp.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(whatsapp.split('=')[1]!)).toBe(buildShareMessage(url));
  });
});
