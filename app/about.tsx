import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { GeometricMark } from '@/components/common/geometric-mark';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { getQuranCorpusMetadata } from '@/lib/quran/metadata';

export default function AboutScreen() {
  const theme = useAtharTheme();
  const metadata = getQuranCorpusMetadata();
  return (
    <Screen header={<AppHeader title="عن أثر" back />}>
      <View style={styles.hero}>
        <GeometricMark size={160} color={theme.primary} accent={theme.accent} opacity={0.85} />
        <AppText variant="display" color={theme.primary} align="center">
          أثر
        </AppText>
        <AppText variant="title" color={theme.muted} align="center">
          مصحفٌ يبقى لمن تحب
        </AppText>
      </View>

      <Card style={styles.card}>
        <AppText variant="title">الفكرة</AppText>
        <AppText color={theme.textSoft}>
          أثر مساحة عربية هادئة لصنع إهداء شخصي والوصول إلى المصحف. لا تدّعي الصفحة ضمان ثواب بعينه،
          ولا تنشر الإهداءات في دليل عام.
        </AppText>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeading}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
          </View>
          <AppText variant="title">مصدر النص القرآني</AppText>
        </View>
        <AppText color={theme.textSoft}>
          النص المعروض هو إصدار Uthmani من Tanzil Quran Text، الإصدار 1.1، مرخّص بموجب Creative
          Commons Attribution 3.0. فهرس البحث مأخوذ من إصدار Simple Clean المنفصل ولا يُعرض بدل النص
          الأصلي.
        </AppText>
        <AppText variant="small" color={theme.muted}>
          تاريخ الاستيراد المثبّت:{' '}
          {new Intl.DateTimeFormat('ar', { dateStyle: 'long' }).format(
            new Date(metadata.generatedAt),
          )}
        </AppText>
        {metadata.source.files.map((file) => (
          <View key={file.role} style={[styles.checksum, { backgroundColor: theme.surfaceMuted }]}>
            <AppText variant="eyebrow">{file.textType}</AppText>
            <AppText variant="small" color={theme.muted} selectable style={styles.hash}>
              SHA-256: {file.sha256}
            </AppText>
          </View>
        ))}
        <View style={styles.links}>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(metadata.source.sourceUrl)}
            style={styles.link}
          >
            <Ionicons name="open-outline" size={18} color={theme.primary} />
            <AppText color={theme.primary}>موقع Tanzil</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(metadata.source.licenseUrl)}
            style={styles.link}
          >
            <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            <AppText color={theme.primary}>نص الرخصة</AppText>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.card}>
        <AppText variant="title">ما لا يجمعه أثر</AppText>
        <AppText color={theme.textSoft}>
          لا عناوين، ولا أرقام هاتف، ولا موقع جغرافي، ولا جهات اتصال، ولا بيانات إعلانية. تقدمك
          ومفضلاتك محليان وخاصان، ويُزامنان تلقائيًا مع جلستك المجهولة الخاصة عندما يكون Supabase
          مفعّلًا. لا تظهر بيانات القراءة في صفحة الإهداء العامة.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  card: { gap: spacing.md, marginBottom: spacing.md },
  cardHeading: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checksum: { padding: spacing.md, borderRadius: radii.md },
  hash: { writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' },
  links: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.md },
  link: { minHeight: 44, flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
});
