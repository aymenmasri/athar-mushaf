import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { FormField } from '@/components/common/form-field';
import { DedicationCover } from '@/components/dedication/dedication-cover';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { dedicationThemes } from '@/constants/dedication-themes';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { createLocalDedication } from '@/lib/dedication/local-repository';
import { createDedication, isSupabaseConfigured } from '@/lib/supabase';
import {
  DedicationFormValues,
  ValidatedDedicationForm,
  dedicationFormSchema,
} from '@/lib/validation/dedication';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import type { DedicationDraft, RecipientStatus } from '@/types/dedication';

const statusOptions: { value: RecipientStatus; label: string }[] = [
  { value: 'living', label: 'حي' },
  { value: 'deceased', label: 'متوفى' },
  { value: 'unspecified', label: 'غير محدد' },
];

export default function CreateDedicationScreen() {
  const router = useRouter();
  const theme = useAtharTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 880;
  const [preview, setPreview] = useState<ValidatedDedicationForm | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DedicationFormValues>({
    resolver: zodResolver(dedicationFormSchema),
    defaultValues: {
      recipientName: '',
      giverName: '',
      message: '',
      recipientStatus: 'unspecified',
      themeKey: 'emerald',
      visibility: 'unlisted',
      confirmed: false,
    },
    mode: 'onTouched',
  });

  const values = watch();

  const showPreview = handleSubmit((valid) => {
    setSubmissionError(null);
    setPreview(dedicationFormSchema.parse(valid));
  });

  async function publish(valid: ValidatedDedicationForm) {
    setPublishing(true);
    setSubmissionError(null);
    const draft: DedicationDraft = {
      recipientName: valid.recipientName,
      giverName: valid.giverName,
      message: valid.message,
      recipientStatus: valid.recipientStatus,
      themeKey: valid.themeKey,
    };
    try {
      const created = isSupabaseConfigured
        ? await createDedication(draft)
        : await createLocalDedication(draft);
      router.replace({ pathname: '/dedication/[slug]', params: { slug: created.slug } });
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'تعذّر إنشاء الإهداء الآن. حاول مرة أخرى بعد قليل.',
      );
    } finally {
      setPublishing(false);
    }
  }

  if (preview) {
    return (
      <Screen header={<AppHeader title="معاينة الإهداء" back />}>
        <View style={[styles.previewLayout, wide && styles.previewLayoutWide]}>
          <View style={styles.previewCover}>
            <DedicationCover dedication={preview} compact={!wide} />
          </View>
          <Card style={styles.previewPanel}>
            <AppText variant="eyebrow" color={theme.accent}>
              خطوة أخيرة
            </AppText>
            <AppText variant="headline">هل يبدو كل شيء صحيحًا؟</AppText>
            <AppText color={theme.muted}>
              راجع الأسماء والرسالة بعناية. يمكنك العودة للتعديل قبل إنشاء الرابط.
            </AppText>
            {!isSupabaseConfigured ? (
              <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
                <AppText variant="small" color={theme.textSoft} style={styles.noticeText}>
                  وضع العرض مفعّل. سيُحفظ الإهداء على هذا الجهاز فقط، ولن يصبح الرابط عامًا حتى
                  إعداد Supabase.
                </AppText>
              </View>
            ) : null}
            {submissionError ? (
              <AppText color={theme.danger} accessibilityRole="alert">
                {submissionError}
              </AppText>
            ) : null}
            <View style={styles.previewActions}>
              <AppButton
                label="تأكيد الإهداء"
                icon="checkmark-circle-outline"
                onPress={() => void publish(preview)}
                loading={publishing}
                fullWidth
              />
              <AppButton
                label="تعديل"
                icon="create-outline"
                variant="secondary"
                onPress={() => setPreview(null)}
                disabled={publishing}
                fullWidth
              />
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader title="إنشاء إهداء" back />}>
      <View style={styles.intro}>
        <AppText variant="eyebrow" color={theme.accent}>
          اصنع أثرًا باسم من تحب
        </AppText>
        <AppText variant="headline">اكتب إهداءك بهدوء</AppText>
        <AppText color={theme.muted}>
          لن يظهر الإهداء في دليل عام. من يملك الرابط فقط يستطيع الوصول إليه.
        </AppText>
      </View>

      <View style={[styles.formLayout, wide && styles.formLayoutWide]}>
        <Card style={styles.formCard}>
          <Controller
            control={control}
            name="recipientName"
            render={({ field: { onBlur, onChange, value, ref } }) => (
              <FormField
                ref={ref}
                label="اسم المُهدى إليه"
                placeholder="مثال: فاطمة ومحمد"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={120}
                error={errors.recipientName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="giverName"
            render={({ field: { onBlur, onChange, value, ref } }) => (
              <FormField
                ref={ref}
                label="اسم صاحب الإهداء"
                placeholder="اسمك كما سيظهر في الصفحة"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={120}
                error={errors.giverName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="message"
            render={({ field: { onBlur, onChange, value, ref } }) => (
              <FormField
                ref={ref}
                label="رسالة الإهداء"
                placeholder="اكتب كلمة صادقة ولطيفة..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={600}
                multiline
                error={errors.message?.message}
              />
            )}
          />

          <View style={styles.fieldGroup}>
            <AppText variant="eyebrow">حالة المُهدى إليه</AppText>
            <Controller
              control={control}
              name="recipientStatus"
              render={({ field: { onChange, value } }) => (
                <View style={styles.choiceRow}>
                  {statusOptions.map((option) => {
                    const selected = value === option.value;
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
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.primary : theme.muted },
                          ]}
                        >
                          {selected ? (
                            <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                          ) : null}
                        </View>
                        <AppText>{option.label}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="eyebrow">طابع الصفحة</AppText>
            <Controller
              control={control}
              name="themeKey"
              render={({ field: { onChange, value } }) => (
                <View style={styles.themeRow}>
                  {dedicationThemes.map((item) => {
                    const selected = value === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="radio"
                        accessibilityLabel={`الطابع ${item.label}`}
                        accessibilityState={{ checked: selected }}
                        onPress={() => onChange(item.key)}
                        style={[
                          styles.themeChoice,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: theme.surface,
                          },
                        ]}
                      >
                        <View style={[styles.themeSwatch, { backgroundColor: item.background }]} />
                        <AppText variant="small">{item.label}</AppText>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={19} color={theme.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="eyebrow">الظهور</AppText>
            <View style={[styles.visibility, { borderColor: theme.border }]}>
              <Ionicons name="link-outline" size={22} color={theme.primary} />
              <View style={styles.visibilityCopy}>
                <AppText>خاص عبر الرابط</AppText>
                <AppText variant="small" color={theme.muted}>
                  لا يوجد بحث عام أو قائمة إهداءات.
                </AppText>
              </View>
            </View>
          </View>

          <Controller
            control={control}
            name="confirmed"
            render={({ field: { onChange, value } }) => (
              <View>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: value }}
                  onPress={() => onChange(!value)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: value ? theme.primary : 'transparent',
                        borderColor: value ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {value ? (
                      <Ionicons name="checkmark" size={17} color={theme.background} />
                    ) : null}
                  </View>
                  <AppText style={styles.checkboxLabel}>
                    أفهم أن كل من يملك الرابط يستطيع رؤية الإهداء.
                  </AppText>
                </Pressable>
                {errors.confirmed?.message ? (
                  <AppText variant="small" color={theme.danger} accessibilityRole="alert">
                    {errors.confirmed.message}
                  </AppText>
                ) : null}
              </View>
            )}
          />

          <AppButton
            label="معاينة الإهداء"
            icon="eye-outline"
            onPress={() => void showPreview()}
            fullWidth
          />
        </Card>

        {wide ? (
          <View style={styles.livePreview}>
            <AppText variant="eyebrow" color={theme.muted}>
              معاينة فورية
            </AppText>
            <DedicationCover
              compact
              dedication={{
                recipientName: values.recipientName || 'اسم من تحب',
                giverName: values.giverName || 'اسمك',
                message: values.message || 'ستظهر رسالتك هنا بكلماتك أنت.',
                recipientStatus: values.recipientStatus,
                themeKey: values.themeKey,
              }}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { maxWidth: 690, alignSelf: 'flex-end', marginBottom: spacing.xl },
  formLayout: { gap: spacing.xl },
  formLayoutWide: { flexDirection: rtlRow, alignItems: 'flex-start' },
  formCard: { flex: 1, gap: spacing.lg },
  livePreview: { width: '42%', gap: spacing.sm },
  fieldGroup: { gap: spacing.sm },
  choiceRow: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.xs },
  choice: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: radii.pill },
  themeRow: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.xs },
  themeChoice: {
    minWidth: 105,
    minHeight: 54,
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xs,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  themeSwatch: { width: 28, height: 28, borderRadius: radii.pill },
  visibility: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  visibilityCopy: { flex: 1 },
  checkboxRow: {
    minHeight: 48,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { flex: 1 },
  previewLayout: { gap: spacing.xl },
  previewLayoutWide: { flexDirection: rtlRow, alignItems: 'center' },
  previewCover: { flex: 1 },
  previewPanel: { flex: 0.75, gap: spacing.md },
  notice: {
    flexDirection: rtlRow,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.md,
  },
  noticeText: { flex: 1 },
  previewActions: { marginTop: spacing.sm, gap: spacing.sm },
});
