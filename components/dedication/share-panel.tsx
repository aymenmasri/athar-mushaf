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
  sharePublicLink,
} from '@/lib/sharing';

type SharePanelProps = {
  slug: string;
  localOnly?: boolean;
};

export function SharePanel({ slug, localOnly = false }: SharePanelProps) {
  const theme = useAtharTheme();
  const url = useMemo(() => getPublicDedicationUrl(slug), [slug]);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function copy() {
    await copyPublicLink(url);
    setFeedback('تم نسخ الرابط');
  }

  async function share() {
    const result = await sharePublicLink(url);
    setFeedback(result === 'copied' ? 'تم نسخ الرابط' : 'تم فتح المشاركة');
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
      {localOnly ? (
        <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
          <AppText variant="small" color={theme.textSoft}>
            هذا رابط معاينة على جهازك. إعداد Supabase مطلوب لإنشاء رابط عام يمكن فتحه من جهاز آخر.
          </AppText>
        </View>
      ) : null}
      <View style={[styles.qrFrame, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
        <QRCode value={url} size={164} color="#173E34" backgroundColor="#FFFFFF" />
      </View>
      <AppText variant="small" color={theme.muted} align="center" numberOfLines={2}>
        {url}
      </AppText>
      <View style={styles.actions}>
        <AppButton label="مشاركة" icon="share-outline" onPress={() => void share()} />
        <AppButton
          label="واتساب"
          icon="logo-whatsapp"
          variant="secondary"
          onPress={() => void openWhatsAppShare(url)}
        />
        <AppButton
          label="نسخ الرابط"
          icon="copy-outline"
          variant="ghost"
          onPress={() => void copy()}
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
