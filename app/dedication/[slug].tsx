import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { EmptyState } from '@/components/common/empty-state';
import { DedicationCover } from '@/components/dedication/dedication-cover';
import { SharePanel } from '@/components/dedication/share-panel';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { getLocalDedication, getPublishedDedicationSlug } from '@/lib/dedication/local-repository';
import { publishLocalDedication } from '@/lib/dedication/publish-local';
import {
  DEMO_DEDICATION,
  DEMO_DEDICATION_GIVER_LABEL,
  DEMO_DEDICATION_SLUG,
  DEMO_DEDICATION_TITLE,
  DEMO_MUSHAF_TITLE,
  getOwnedDedication,
  getPublicDedication,
  isSupabaseConfigured,
} from '@/lib/supabase';
import type { Dedication, PublicDedication } from '@/types/dedication';

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      dedication: PublicDedication;
      localOnly: boolean;
      manageable: boolean;
      localDedication?: Dedication;
    }
  | { status: 'missing' }
  | { status: 'error'; message: string };

export default function PublicDedicationScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const router = useRouter();
  const theme = useAtharTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [publishingLocal, setPublishingLocal] = useState(false);
  const [publicationError, setPublicationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!slug) {
        setState({ status: 'missing' });
        return;
      }
      if (slug === DEMO_DEDICATION_SLUG) {
        setState({
          status: 'ready',
          dedication: DEMO_DEDICATION,
          localOnly: true,
          manageable: false,
        });
        return;
      }
      try {
        if (slug.startsWith('local-')) {
          const publishedSlug = await getPublishedDedicationSlug(slug);
          if (publishedSlug) {
            router.replace({ pathname: '/dedication/[slug]', params: { slug: publishedSlug } });
            return;
          }
          const dedication = await getLocalDedication(slug);
          if (!mounted) return;
          setState(
            dedication
              ? {
                  status: 'ready',
                  dedication,
                  localDedication: dedication,
                  localOnly: true,
                  manageable: true,
                }
              : { status: 'missing' },
          );
          return;
        }
        if (!isSupabaseConfigured) {
          setState({ status: 'missing' });
          return;
        }
        const dedication = await getPublicDedication(slug);
        if (!mounted) return;
        let manageable = false;
        if (dedication) {
          try {
            manageable = Boolean(await getOwnedDedication(slug));
          } catch {
            // Ownership controls are best-effort and must never block public reading.
          }
        }
        if (!mounted) return;
        setState(
          dedication
            ? { status: 'ready', dedication, localOnly: false, manageable }
            : { status: 'missing' },
        );
      } catch {
        if (!mounted) return;
        setState({
          status: 'error',
          message: 'تعذّر تحميل الإهداء. تحقّق من الاتصال ثم حاول مرة أخرى.',
        });
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [router, slug]);

  async function publishStoredDedication(localDedication: Dedication) {
    setPublishingLocal(true);
    setPublicationError(null);
    try {
      const published = await publishLocalDedication(localDedication);
      router.replace({ pathname: '/dedication/[slug]', params: { slug: published.slug } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setPublicationError(
        /[\u0600-\u06ff]/u.test(message)
          ? message
          : 'تعذّر نشر الإهداء الآن. بقي محفوظًا على هذا الجهاز ولم يُنشأ رابط عام.',
      );
    } finally {
      setPublishingLocal(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <Screen header={<AppHeader back />}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
          <AppText color={theme.muted}>نفتح الإهداء...</AppText>
        </View>
      </Screen>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    return (
      <Screen header={<AppHeader back />}>
        <EmptyState
          icon="link-outline"
          title="الإهداء غير متاح"
          message={
            state.status === 'error'
              ? state.message
              : 'قد يكون الرابط غير صحيح، أو أن صاحب الإهداء أوقف الصفحة.'
          }
        />
        <AppButton label="الذهاب إلى أثر" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const { dedication, localOnly, manageable, localDedication } = state;
  const isDemoDedication = dedication.slug === DEMO_DEDICATION_SLUG;
  return (
    <Screen header={<AppHeader back />}>
      <View style={[styles.layout, wide && styles.layoutWide]}>
        <View style={styles.coverColumn}>
          <DedicationCover
            dedication={dedication}
            createdAt={dedication.createdAt}
            title={isDemoDedication ? DEMO_DEDICATION_TITLE : undefined}
            giverLabel={isDemoDedication ? DEMO_DEDICATION_GIVER_LABEL : undefined}
          />
          <AppButton
            label="ابدأ القراءة"
            icon="book-outline"
            onPress={() => router.push('/quran')}
            fullWidth
            style={styles.readButton}
          />
        </View>
        <View style={styles.sideColumn}>
          <View style={styles.brandIntro}>
            <AppText variant="display" color={theme.primary}>
              أثر
            </AppText>
            <AppText variant="title" color={theme.muted}>
              {isDemoDedication ? DEMO_MUSHAF_TITLE : 'مصحفٌ يبقى لمن تحب'}
            </AppText>
          </View>
          <SharePanel
            slug={dedication.slug}
            localOnly={localOnly}
            canPublishLocal={Boolean(localDedication)}
            onPublishLocal={
              localDedication ? () => void publishStoredDedication(localDedication) : undefined
            }
            publishingLocal={publishingLocal}
            publicationError={publicationError}
          />
          {manageable ? (
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                router.push({ pathname: '/manage/[slug]', params: { slug: dedication.slug } })
              }
              style={styles.manageLink}
            >
              <Ionicons name="settings-outline" size={18} color={theme.muted} />
              <AppText variant="small" color={theme.muted}>
                إدارة هذا الإهداء
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  layout: { gap: spacing.xl },
  layoutWide: { flexDirection: rtlRow, alignItems: 'center' },
  coverColumn: { flex: 1 },
  sideColumn: { flex: 0.8, gap: spacing.lg },
  readButton: { marginTop: spacing.md },
  brandIntro: { alignItems: 'flex-end' },
  manageLink: {
    minHeight: 44,
    alignSelf: 'center',
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
