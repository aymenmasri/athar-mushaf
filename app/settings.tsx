import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { useReading } from '@/providers/reading-provider';
import type { ReaderFontSize, ReaderTheme, ReadingPreferences } from '@/types/reading';

type Option<T extends string> = { value: T; label: string; preview?: string };

function ChoiceRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const theme = useAtharTheme();
  return (
    <View style={styles.choices}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.choice,
              {
                backgroundColor: selected ? theme.primarySoft : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            {option.preview ? (
              <AppText
                align="center"
                color={selected ? theme.primary : theme.text}
                style={{
                  fontSize: Number(option.preview),
                  lineHeight: Math.max(32, Number(option.preview) + 10),
                }}
              >
                أ
              </AppText>
            ) : null}
            <AppText variant="small" color={selected ? theme.primary : theme.text} align="center">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAtharTheme();
  const { preferences, updatePreferences, resetPreferences } = useReading();

  function update<K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) {
    updatePreferences({ [key]: value });
  }

  return (
    <Screen header={<AppHeader title="إعدادات القراءة" back />}>
      <View style={styles.intro}>
        <AppText variant="headline">اقرأ بالطريقة الأنسب لك</AppText>
        <AppText color={theme.muted}>
          تُحفظ هذه الخيارات على جهازك وتُطبّق مباشرة على القارئ.
        </AppText>
      </View>

      <Card style={styles.section}>
        <View>
          <AppText variant="title">حجم النص</AppText>
          <AppText variant="small" color={theme.muted}>
            يمكنك أيضًا استخدام تكبير النظام أو المتصفح.
          </AppText>
        </View>
        <ChoiceRow<ReaderFontSize>
          value={preferences.fontSize}
          onChange={(value) => update('fontSize', value)}
          options={[
            { value: 'small', label: 'صغير', preview: '20' },
            { value: 'medium', label: 'متوسط', preview: '25' },
            { value: 'large', label: 'كبير', preview: '30' },
            { value: 'xlarge', label: 'كبير جدًا', preview: '36' },
          ]}
        />
      </Card>

      <Card style={styles.section}>
        <View>
          <AppText variant="title">طابع القراءة</AppText>
          <AppText variant="small" color={theme.muted}>
            فاتح، داكن، أو ورقي دافئ.
          </AppText>
        </View>
        <ChoiceRow<ReaderTheme>
          value={preferences.theme}
          onChange={(value) => update('theme', value)}
          options={[
            { value: 'light', label: 'فاتح' },
            { value: 'dark', label: 'داكن' },
            { value: 'sepia', label: 'سيبيا' },
          ]}
        />
      </Card>

      <Card style={styles.section}>
        <View>
          <AppText variant="title">تباعد السطور</AppText>
          <AppText variant="small" color={theme.muted}>
            اختر المسافة المريحة للعين.
          </AppText>
        </View>
        <ChoiceRow<ReadingPreferences['lineSpacing']>
          value={preferences.lineSpacing}
          onChange={(value) => update('lineSpacing', value)}
          options={[
            { value: 'compact', label: 'متقارب' },
            { value: 'comfortable', label: 'مريح' },
            { value: 'airy', label: 'واسع' },
          ]}
        />
      </Card>

      <Card style={styles.toggleCard}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: preferences.showAyahNumbers }}
          onPress={() => update('showAyahNumbers', !preferences.showAyahNumbers)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleCopy}>
            <AppText variant="title">أرقام الآيات</AppText>
            <AppText variant="small" color={theme.muted}>
              إظهار أو إخفاء الرقم المنفصل بجانب كل آية.
            </AppText>
          </View>
          <View
            style={[
              styles.switchTrack,
              { backgroundColor: preferences.showAyahNumbers ? theme.primary : theme.border },
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: theme.background,
                  transform: [{ translateX: preferences.showAyahNumbers ? -20 : 0 }],
                },
              ]}
            />
          </View>
        </Pressable>
      </Card>

      <AppButton label="إعادة الإعدادات الافتراضية" variant="ghost" onPress={resetPreferences} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.xl },
  section: { gap: spacing.md, marginBottom: spacing.md },
  choices: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.xs },
  choice: {
    flex: 1,
    minWidth: 96,
    minHeight: 62,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCard: { marginBottom: spacing.md },
  toggleRow: { minHeight: 54, flexDirection: rtlRow, alignItems: 'center', gap: spacing.md },
  toggleCopy: { flex: 1 },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: radii.pill,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: { width: 24, height: 24, borderRadius: radii.pill },
});
