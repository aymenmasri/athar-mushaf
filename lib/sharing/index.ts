import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

import { isValidDedicationSlug } from '@/lib/supabase/slug';

export const DEFAULT_SHARE_TEXT = 'أهديتك مصحفًا رقميًا عبر أثر\nمصحفٌ يبقى لمن تحب';

export class PublicDedicationUrlError extends Error {
  readonly code = 'PUBLIC_DEDICATION_URL_UNAVAILABLE';

  constructor(message = 'لا يمكن إنشاء رابط عام صالح لهذا الإهداء.') {
    super(message);
    this.name = 'PublicDedicationUrlError';
  }
}

function configuredPublicOrigin(): string | null {
  const value = process.env.EXPO_PUBLIC_APP_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const originOnly =
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === '/' || url.pathname === '');
    if (!originOnly || url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function assertShareablePublicUrl(value: string): void {
  try {
    const url = new URL(value);
    const slug = url.pathname.match(/^\/dedication\/([^/]+)\/?$/u)?.[1];
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !slug ||
      !isValidDedicationSlug(decodeURIComponent(slug))
    ) {
      throw new PublicDedicationUrlError();
    }
  } catch (error) {
    if (error instanceof PublicDedicationUrlError) throw error;
    throw new PublicDedicationUrlError();
  }
}

export function getPublicDedicationUrl(slug: string): string {
  if (!isValidDedicationSlug(slug)) {
    throw new PublicDedicationUrlError();
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const origin = new URL(window.location.origin);
      if (origin.protocol !== 'https:' && origin.protocol !== 'http:') {
        throw new PublicDedicationUrlError();
      }
      return `${origin.origin}/dedication/${encodeURIComponent(slug)}`;
    } catch (error) {
      if (error instanceof PublicDedicationUrlError) throw error;
      throw new PublicDedicationUrlError();
    }
  }

  const origin = configuredPublicOrigin();
  if (!origin) {
    throw new PublicDedicationUrlError(
      'لم يُضبط عنوان الموقع العام لهذا الإصدار، لذلك لا يمكن إنشاء رابط أو رمز QR.',
    );
  }

  return `${origin}/dedication/${encodeURIComponent(slug)}`;
}

export function buildShareMessage(url: string): string {
  assertShareablePublicUrl(url);
  return `${DEFAULT_SHARE_TEXT}\n${url}`;
}

export function buildWhatsAppUrl(url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareMessage(url))}`;
}

export async function copyPublicLink(url: string): Promise<void> {
  assertShareablePublicUrl(url);
  await Clipboard.setStringAsync(url);
}

export async function sharePublicLink(url: string): Promise<'shared' | 'copied'> {
  const message = buildShareMessage(url);
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    if (navigator.share) {
      await navigator.share({ title: 'أثر', text: DEFAULT_SHARE_TEXT, url });
      return 'shared';
    }
    await copyPublicLink(url);
    return 'copied';
  }
  await Share.share({ title: 'أثر', message, url });
  return 'shared';
}

export async function openWhatsAppShare(url: string): Promise<void> {
  await Linking.openURL(buildWhatsAppUrl(url));
}
