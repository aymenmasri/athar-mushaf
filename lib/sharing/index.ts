import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

export const DEFAULT_SHARE_TEXT = 'أهديتك مصحفًا رقميًا عبر أثر\nمصحفٌ يبقى لمن تحب';

export function getPublicDedicationUrl(slug: string): string {
  const configuredOrigin = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/u, '');
  if (configuredOrigin) return `${configuredOrigin}/dedication/${encodeURIComponent(slug)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/dedication/${encodeURIComponent(slug)}`;
  }
  return Linking.createURL(`/dedication/${slug}`);
}

export function buildShareMessage(url: string): string {
  return `${DEFAULT_SHARE_TEXT}\n${url}`;
}

export function buildWhatsAppUrl(url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareMessage(url))}`;
}

export async function copyPublicLink(url: string): Promise<void> {
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
