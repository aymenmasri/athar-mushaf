import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import {
  copyPublicLink,
  getPublicDedicationUrl,
  openWhatsAppShare,
  PublicDedicationUrlError,
  sharePublicLink,
} from '@/lib/sharing';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isValidDedicationSlug } from '@/lib/supabase/slug';

type SharePanelProps = {
  slug: string;
  localOnly?: boolean;
  canPublishLocal?: boolean;
  onPublishLocal?: () => void;
  publishingLocal?: boolean;
  publicationError?: string | null;
};

export function SharePanel({
  slug,
  localOnly = false,
  canPublishLocal = false,
  onPublishLocal,
  publishingLocal = false,
  publicationError,
}: SharePanelProps) {
  const theme = useAtharTheme();
  const urlResult = useMemo(() => {
    if (localOnly || !isValidDedicationSlug(slug)) return null;
    try {
      return { url: getPublicDedicationUrl(slug), error: null };
    } catch (error) {
      return {
        url: null,
        error:
          error instanceof PublicDedicationUrlError
            ? error.message
            : 'تعذّر إنشاء رابط عام لهذا الإهداء.',
      };
    }
  }, [localOnly, slug]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [operation, setOperation] = useState<'copy' | 'share' | 'whatsapp' | null>(null);

  if (localOnly || !urlResult?.url) {
    const isDeviceOnly = slug.startsWith('local-');
    const notice = isDeviceOnly
      ? 'هذا الإهداء محفوظ على هذا الجهاز فقط ولا يمكن مشاركته.'
      : 'هذا إهداء تجريبي للمعاينة، ولا يملك رابط مشاركة عامًا.';

    return (
      <Card style={styles.card}>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="cloud-offline-outline" size={23} color={theme.primary} />
          </View>
          <View style={styles.headingCopy}>
            <AppText variant="title">المشاركة غير متاحة</AppText>
            <AppText variant="small" color={theme.muted}>
              {notice}
            </AppText>
          </View>
        </View>
        {urlResult?.error ? (
          <AppText color={theme.danger} accessibilityRole="alert">
            {urlResult.error}
          </AppText>
        ) : null}
        {isDeviceOnly && canPublishLocal ? (
          <>
            {!isSupabaseConfigured ? (
              <AppText color={theme.danger} accessibilityRole="alert">
                تعذّر نشر الإهداء. يمكنك الاحتفاظ به على هذا الجهاز فقط.
              </AppText>
            ) : null}
            {publicationError ? (
              <AppText color={theme.danger} accessibilityRole="alert">
                {publicationError}
              </AppText>
            ) : null}
            <AppButton
              label="نشر الإهداء"
              icon="cloud-upload-outline"
              onPress={onPublishLocal}
              loading={publishingLocal}
              disabled={!isSupabaseConfigured || !onPublishLocal}
              fullWidth
              testID="publish-local-dedication"
            />
          </>
        ) : null}
      </Card>
    );
  }

  const url = urlResult.url;

  async function copy() {
    setOperation('copy');
    try {
      await copyPublicLink(url);
      setFeedback('تم نسخ الرابط');
    } catch {
      setFeedback('تعذّر نسخ الرابط. حاول مرة أخرى.');
    } finally {
      setOperation(null);
    }
  }

  async function share() {
    setOperation('share');
    try {
      const result = await sharePublicLink(url);
      setFeedback(result === 'copied' ? 'تم نسخ الرابط' : 'تم فتح المشاركة');
    } catch {
      setFeedback('تعذّر فتح المشاركة. حاول مرة أخرى.');
    } finally {
      setOperation(null);
    }
  }

  async function whatsapp() {
    setOperation('whatsapp');
    try {
      await openWhatsAppShare(url);
      setFeedback('تم فتح واتساب');
    } catch {
      setFeedback('تعذّر فتح واتساب. يمكنك نسخ الرابط بدلًا من ذلك.');
    } finally {
      setOperation(null);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="share-social-outline" size={23} color={theme.primary} />
        </View>
        <View style={styles.headingCopy}>
          <AppText variant="title">شارك الإهداء</AppText>
          <AppText variant="small" color={theme.muted}>
            رمز QR يحتوي رابط الصفحة فقط.
          </AppText>
        </View>
      </View>
      <View
        testID="public-dedication-qr"
        style={[styles.qrFrame, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}
      >
        <QRCode value={url} size={164} color="#173E34" backgroundColor="#FFFFFF" />
      </View>
      <AppText variant="small" color={theme.muted} align="center" numberOfLines={2}>
        {url}
      </AppText>
      <View style={styles.actions}>
        <AppButton
          label="مشاركة"
          icon="share-outline"
          onPress={() => void share()}
          disabled={operation !== null}
          loading={operation === 'share'}
        />
        <AppButton
          label="واتساب"
          icon="logo-whatsapp"
          variant="secondary"
          onPress={() => void whatsapp()}
          disabled={operation !== null}
          loading={operation === 'whatsapp'}
          testID="share-whatsapp"
        />
        <AppButton
          label="نسخ الرابط"
          icon="copy-outline"
          variant="ghost"
          onPress={() => void copy()}
          disabled={operation !== null}
          loading={operation === 'copy'}
        />
      </View>
      {feedback ? (
        <AppText variant="small" color={theme.primary} align="center" accessibilityRole="alert">
          {feedback}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  heading: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.sm },
  headingCopy: { flex: 1 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: { padding: spacing.md, borderRadius: radii.md },
  qrFrame: {
    alignSelf: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  actions: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
