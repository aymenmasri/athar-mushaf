import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { Screen } from '@/components/layout/screen';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { useReading } from '@/providers/reading-provider';

const principles = [
  {
    icon: 'heart-outline' as const,
    title: 'كلمة تحمل اسم من تحب',
    body: 'اكتب إهداءً شخصيًا في صفحة هادئة لا تظهر في أي دليل عام.',
  },
  {
    icon: 'book-outline' as const,
    title: 'مصحف قريب أينما كنت',
    body: 'اقرأ السور، واحفظ موضعك ومفضلاتك على جهازك بخصوصية.',
  },
  {
    icon: 'share-social-outline' as const,
    title: 'رابط واحد يصل بسهولة',
    body: 'شارك الإهداء عبر واتساب، أو انسخ الرابط، أو اعرض رمز QR.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAtharTheme();
  const { width } = useWindowDimensions();
  const { progress } = useReading();
  const wide = width >= 820;

  return (
    <Screen
      contentStyle={styles.screen}
      header={
        <View style={[styles.headerShell, { borderBottomColor: theme.border }]}>
          <View style={styles.headerInner}>
            <View style={styles.brandRow}>
              <View style={[styles.brandDot, { backgroundColor: theme.accent }]} />
              <AppText variant="title">أثر</AppText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="عن أثر"
                onPress={() => router.push('/about')}
                style={styles.headerLink}
              >
                <AppText variant="small" color={theme.textSoft}>
                  عن أثر
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="الإعدادات"
                onPress={() => router.push('/settings')}
                style={styles.iconButton}
              >
                <Ionicons name="options-outline" size={23} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
      }
    >
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
          <View style={[styles.kicker, { backgroundColor: theme.primarySoft }]}>
            <View style={[styles.kickerDot, { backgroundColor: theme.accent }]} />
            <AppText variant="eyebrow" color={theme.primary}>
              إهداءٌ يبقى قريبًا
            </AppText>
          </View>
          <AppText variant={wide ? 'display' : 'headline'} style={styles.heroTitle}>
            مصحفٌ يبقى{`\n`}لمن تحب
          </AppText>
          <AppText color={theme.textSoft} style={styles.heroBody}>
            أهدِ من تحب مصحفًا رقميًا يحمل اسمه، واكتب له كلمة تبقى أثرًا من نور.
          </AppText>
          <View style={styles.heroActions}>
            <AppButton
              label="أنشئ إهداءً"
              icon="sparkles-outline"
              onPress={() => router.push('/create-dedication')}
            />
            <AppButton
              label="تصفّح المصحف"
              icon="book-outline"
              variant="secondary"
              onPress={() => router.push('/quran')}
            />
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/dedication/demo-mahmoud-wahida')}
            style={styles.demoLink}
          >
            <Ionicons name="eye-outline" size={18} color={theme.accent} />
            <AppText variant="small" color={theme.muted}>
              شاهد إهداءً تجريبيًا
            </AppText>
          </Pressable>
        </View>

        <View
          style={[
            styles.artFrame,
            { backgroundColor: theme.primary, borderColor: theme.accentSoft },
          ]}
        >
          <View style={[styles.artHalo, { borderColor: theme.accentSoft }]} />
          <Image
            source={require('@/assets/images/athar-adaptive-foreground.png')}
            contentFit="contain"
            accessibilityLabel="شعار أثر الهندسي"
            style={[styles.heroEmblem, { width: wide ? 270 : 230 }]}
          />
          <AppText color={theme.accentSoft} align="center" style={styles.artSlogan}>
            مصحفٌ يبقى لمن تحب
          </AppText>
        </View>
      </View>

      {progress ? (
        <Card style={styles.continueCard}>
          <View style={[styles.continueIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="bookmark" size={23} color={theme.primary} />
          </View>
          <View style={styles.continueCopy}>
            <AppText variant="eyebrow" color={theme.accent}>
              آخر موضع محفوظ
            </AppText>
            <AppText variant="title">تابع القراءة</AppText>
            <AppText variant="small" color={theme.muted}>
              السورة {progress.lastSurahNumber} · الآية {progress.lastAyahNumber} · بدأت{' '}
              {progress.startedSurahs.length} سورة
            </AppText>
          </View>
          <AppButton
            label="متابعة"
            icon="arrow-back"
            onPress={() =>
              router.push({
                pathname: '/quran/surah/[surahNumber]',
                params: {
                  surahNumber: String(progress.lastSurahNumber),
                  ayah: String(progress.lastAyahNumber),
                },
              })
            }
          />
        </Card>
      ) : null}

      <View style={styles.sectionHeading}>
        <AppText variant="eyebrow" color={theme.accent} align="center">
          ببساطة وخصوصية
        </AppText>
        <AppText variant="headline" align="center" style={styles.sectionTitle}>
          من الإهداء إلى القراءة
        </AppText>
        <AppText color={theme.muted} align="center" style={styles.sectionBody}>
          تجربة عربية هادئة صُممت لتجعل الكلمة الطيبة والقراءة في مكان واحد.
        </AppText>
      </View>

      <View style={[styles.principles, wide && styles.principlesWide]}>
        {principles.map((item, index) => (
          <Card key={item.title} style={[styles.principleCard, wide && styles.principleCardWide]}>
            <View style={styles.principleTop}>
              <View style={[styles.number, { borderColor: theme.border }]}>
                <AppText variant="small" color={theme.muted} align="center">
                  ٠{index + 1}
                </AppText>
              </View>
              <View style={[styles.principleIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={item.icon} size={25} color={theme.primary} />
              </View>
            </View>
            <AppText variant="title" style={styles.principleTitle}>
              {item.title}
            </AppText>
            <AppText color={theme.muted}>{item.body}</AppText>
          </Card>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppText variant="small" color={theme.muted} align="center">
          أثر · لا إعلانات، لا تتبّع، ولا دليل عام للإهداءات
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')}>
          <AppText variant="small" color={theme.primary} align="center">
            الخصوصية
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xl },
  headerShell: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerInner: {
    width: '100%',
    maxWidth: 1120,
    minHeight: 68,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    flexDirection: rtlRow,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
  brandDot: { width: 8, height: 8, borderRadius: radii.pill },
  headerActions: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
  headerLink: { minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: spacing.xl, alignItems: 'stretch' },
  heroWide: {
    minHeight: 560,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xxl,
  },
  heroCopy: { flex: 1, alignItems: 'flex-end' },
  heroCopyWide: { paddingVertical: spacing.xxl },
  kicker: {
    flexDirection: rtlRow,
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  kickerDot: { width: 6, height: 6, borderRadius: radii.pill },
  heroTitle: { marginTop: spacing.md },
  heroBody: { maxWidth: 560, fontSize: 20, lineHeight: 36, marginTop: spacing.sm },
  heroActions: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  demoLink: {
    minHeight: 44,
    flexDirection: rtlRow,
    gap: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  artFrame: {
    flex: 0.9,
    minHeight: 410,
    borderRadius: 180,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  artHalo: {
    width: '82%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    position: 'absolute',
    opacity: 0.35,
  },
  heroEmblem: { aspectRatio: 1 },
  artSlogan: { marginTop: -spacing.xl },
  continueCard: {
    marginTop: spacing.xxl,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.md,
  },
  continueIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCopy: { flex: 1 },
  sectionHeading: { alignItems: 'center', marginTop: spacing.hero, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 34, lineHeight: 48, marginTop: spacing.xs },
  sectionBody: { maxWidth: 620 },
  principles: { gap: spacing.md },
  principlesWide: { flexDirection: rtlRow },
  principleCard: { flex: 1, minHeight: 250 },
  principleCardWide: { minWidth: 0 },
  principleTop: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleTitle: { marginTop: spacing.lg, fontSize: 23, lineHeight: 36 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.hero,
    paddingTop: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
