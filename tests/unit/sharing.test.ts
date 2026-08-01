import { Platform } from 'react-native';

import {
  DEFAULT_SHARE_TEXT,
  PublicDedicationUrlError,
  buildShareMessage,
  buildWhatsAppUrl,
  getPublicDedicationUrl,
} from '@/lib/sharing';

describe('sharing adapter', () => {
  const remoteSlug = 'd_0123456789abcdef0123456789abcdef';
  const url = `https://athar.example/dedication/${remoteSlug}`;

  it('builds the sober Arabic share message followed by the public URL', () => {
    expect(buildShareMessage(url)).toBe(`${DEFAULT_SHARE_TEXT}\n${url}`);
  });

  it('encodes the complete message for WhatsApp', () => {
    const whatsapp = buildWhatsAppUrl(url);
    expect(whatsapp.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(whatsapp.split('=')[1]!)).toBe(buildShareMessage(url));
  });

  it('rejects a local dedication instead of producing a public URL', () => {
    expect(() => getPublicDedicationUrl('local-0123456789abcdef')).toThrow(
      PublicDedicationUrlError,
    );
  });

  it('prefers the current browser origin over the configured production origin on Web', () => {
    const originalPlatform = Platform.OS;
    const originalWindow = globalThis.window;
    process.env.EXPO_PUBLIC_APP_URL = 'https://configured.example';
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://current.example' } },
    });

    try {
      expect(getPublicDedicationUrl(remoteSlug)).toBe(
        `https://current.example/dedication/${remoteSlug}`,
      );
    } finally {
      delete process.env.EXPO_PUBLIC_APP_URL;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
