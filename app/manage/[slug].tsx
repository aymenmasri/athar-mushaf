import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { EmptyState } from '@/components/common/empty-state';
import { FormField } from '@/components/common/form-field';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { dedicationThemes } from '@/constants/dedication-themes';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import {
  deleteLocalDedication,
  getOwnedLocalDedication,
  updateLocalDedication,
} from '@/lib/dedication/local-repository';
import {
  deleteOwnedDedication,
  getOwnedDedication,
  isSupabaseConfigured,
  updateOwnedDedication,
} from '@/lib/supabase';
import { copyPublicLink, getPublicDedicationUrl } from '@/lib/sharing';
import { dedicationManageSchema } from '@/lib/validation/dedication';
import type { Dedication } from '@/types/dedication';

export default function ManageDedicationScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const router = useRouter();
  const theme = useAtharTheme();
  const [dedication, setDedication] = useState<Dedication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operation, setOperation] = useState<'toggle' | 'delete' | 'copy' | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');
  const [giverName, setGiverName] = useState('');
  const [themeKey, setThemeKey] = useState('emerald');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const url = useMemo(() => (slug ? getPublicDedicationUrl(slug) : ''), [slug]);
  const localOnly = Boolean(slug?.startsWith('local-'));

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (mounted) {
        setLoading(true);
        setLoadError(false);
      }
      if (!slug) {
        if (mounted) {
          setLoadError(true);
          setLoading(false);
        }
        return;
      }
      try {
        const value = localOnly
          ? await getOwnedLocalDedication(slug)
          : isSupabaseConfigured
            ? await getOwnedDedication(slug)
            : null;
        if (!mounted) return;
        setDedication(value);
        if (value) {
          setMessage(value.message);
          setGiverName(value.giverName);
          setThemeKey(value.themeKey);
        }
      } catch {
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [localOnly, slug]);

  async function save() {
    if (!dedication || !slug) return;
    const validated = dedicationManageSchema.safeParse({ message, giverName, themeKey });
    if (!validated.success) {
      setFeedback(validated.error.issues[0]?.message ?? 'تحقق من الاسم والرسالة.');
      return;
    }
    setSaving(true);
    try {
      const updated = localOnly
        ? await updateLocalDedication(slug, {
            message: validated.data.message,
            giverName: validated.data.giverName,
            themeKey: validated.data.themeKey,
          })
        : await updateOwnedDedication(slug, {
            message: validated.data.message,
            giverName: validated.data.giverName,
            themeKey: validated.data.themeKey,
          });
      setDedication(updated);
      setFeedback('تم حفظ التغييرات');
    } catch {
      setFeedback('تعذّر حفظ التغييرات.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!dedication || !slug) return;
    setOperation('toggle');
    try {
      const updated = localOnly
        ? await updateLocalDedication(slug, { isActive: !dedication.isActive })
        : await updateOwnedDedication(slug, { isActive: !dedication.isActive });
      if (!updated) {
        setFeedback('تعذّر العثور على الإهداء أو لم تعد تملك حق إدارته.');
        return;
      }
      setDedication(updated);
      setFeedback(updated.isActive ? 'تم تفعيل الصفحة' : 'تم إيقاف الصفحة');
    } catch {
      setFeedback('تعذّر تغيير حالة الصفحة. تحقق من الاتصال ثم أعد المحاولة.');
    } finally {
      setOperation(null);
    }
  }

  async function remove() {
    if (!slug) return;
    setOperation('delete');
    try {
      const deleted = localOnly
        ? await deleteLocalDedication(slug)
        : await deleteOwnedDedication(slug);
      if (deleted) {
        router.replace('/');
      } else {
        setFeedback('تعذّر العثور على الإهداء أو لم تعد تملك حق حذفه.');
      }
    } catch {
      setFeedback('تعذّر حذف الإهداء. تحقق من الاتصال ثم أعد المحاولة.');
    } finally {
      setOperation(null);
    }
  }

  if (loading) {
    return (
      <Screen header={<AppHeader title="إدارة الإهداء" back />}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!dedication) {
    return (
      <Screen header={<AppHeader title="إدارة الإهداء" back />}>
        <EmptyState
          icon={loadError ? 'cloud-offline-outline' : 'lock-closed-outline'}
          title={loadError ? 'تعذّر تحميل الإهداء' : 'لا يمكن إدارة هذا الإهداء'}
          message={
            loadError
              ? 'تحقق من الاتصال وإعداد Supabase ثم أعد فتح الصفحة.'
              : 'هذه الصفحة متاحة فقط لصاحب الإهداء على جهازه أو جلسته الأصلية.'
          }
        />
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader title="إدارة الإهداء" back />}>
      <View style={styles.intro}>
        <AppText variant="headline">إهداء إلى {dedication.recipientName}</AppText>
        <AppText color={theme.muted}>النص القرآني غير قابل للتعديل من هذه الصفحة.</AppText>
      </View>
      <View style={styles.grid}>
        <Card style={styles.editor}>
          <FormField
            label="اسم صاحب الإهداء"
            value={giverName}
            onChangeText={setGiverName}
            maxLength={120}
          />
          <FormField
            label="رسالة الإهداء"
            value={message}
            onChangeText={setMessage}
            maxLength={600}
            multiline
          />
          <View style={styles.themeRow}>
            {dedicationThemes.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: themeKey === item.key }}
                onPress={() => setThemeKey(item.key)}
                style={[
                  styles.themeChoice,
                  {
                    borderColor: themeKey === item.key ? theme.primary : theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: item.background }]} />
                <AppText variant="small">{item.label}</AppText>
              </Pressable>
            ))}
          </View>
          <AppButton label="حفظ التغييرات" onPress={() => void save()} loading={saving} fullWidth />
          {feedback ? (
            <AppText variant="small" color={theme.primary} accessibilityRole="alert">
              {feedback}
            </AppText>
          ) : null}
        </Card>

        <View style={styles.tools}>
          <Card style={styles.qrCard}>
            <View style={[styles.qrFrame, { borderColor: theme.border }]}>
              <QRCode value={url} size={150} color="#173E34" backgroundColor="#FFFFFF" />
            </View>
            <AppButton
              label="نسخ الرابط"
              icon="copy-outline"
              variant="secondary"
              loading={operation === 'copy'}
              onPress={() => {
                setOperation('copy');
                void copyPublicLink(url)
                  .then(() => setFeedback('تم نسخ الرابط'))
                  .catch(() => setFeedback('تعذّر نسخ الرابط.'))
                  .finally(() => setOperation(null));
              }}
              fullWidth
            />
          </Card>
          <Card style={styles.dangerCard}>
            <View style={styles.dangerHeading}>
              <Ionicons name="shield-outline" size={24} color={theme.danger} />
              <AppText variant="title">التحكم في الصفحة</AppText>
            </View>
            <AppButton
              label={dedication.isActive ? 'إيقاف الصفحة' : 'إعادة تفعيل الصفحة'}
              icon={dedication.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              variant="ghost"
              loading={operation === 'toggle'}
              disabled={operation !== null}
              onPress={() => void toggleActive()}
              fullWidth
            />
            {!confirmDelete ? (
              <AppButton
                label="حذف الإهداء نهائيًا"
                icon="trash-outline"
                variant="danger"
                onPress={() => setConfirmDelete(true)}
                fullWidth
              />
            ) : (
              <View style={[styles.confirmBox, { backgroundColor: theme.dangerSoft }]}>
                <AppText color={theme.danger}>
                  الحذف نهائي ولا يمكن التراجع عنه. هل تريد المتابعة؟
                </AppText>
                <View style={styles.confirmActions}>
                  <AppButton
                    label="نعم، احذف"
                    variant="danger"
                    loading={operation === 'delete'}
                    disabled={operation !== null}
                    onPress={() => void remove()}
                  />
                  <AppButton
                    label="إلغاء"
                    variant="ghost"
                    onPress={() => setConfirmDelete(false)}
                  />
                </View>
              </View>
            )}
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 420, alignItems: 'center', justifyContent: 'center' },
  intro: { marginBottom: spacing.xl },
  grid: { gap: spacing.lg },
  editor: { gap: spacing.lg },
  tools: { gap: spacing.lg },
  themeRow: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.xs },
  themeChoice: {
    minHeight: 48,
    minWidth: 95,
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  swatch: { width: 26, height: 26, borderRadius: radii.pill },
  qrCard: { alignItems: 'stretch', gap: spacing.md },
  qrFrame: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  dangerCard: { gap: spacing.md },
  dangerHeading: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.sm },
  confirmBox: { borderRadius: radii.md, padding: spacing.md, gap: spacing.md },
  confirmActions: { flexDirection: rtlRow, flexWrap: 'wrap', gap: spacing.xs },
});
