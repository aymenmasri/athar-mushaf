import { StyleSheet } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

const sections = [
  {
    title: 'البيانات التي تكتبها',
    body: 'يحتوي الإهداء على اسم المُهدى إليه، واسم صاحب الإهداء، والرسالة، والطابع المختار. في وضع العرض تبقى هذه البيانات على جهازك. عند تفعيل Supabase تُحفظ لتوفير الرابط غير المدرج.',
  },
  {
    title: 'بيانات القراءة',
    body: 'آخر موضع قراءة والمفضلات والإعدادات خاصة بالقارئ وتُحفظ محليًا. عند تفعيل Supabase تُنشأ جلسة مجهولة تلقائيًا وتُزامن المفضلات وموضع القراءة فقط مع حسابها المحمي؛ أما إعدادات العرض فتبقى على الجهاز. لا تظهر هذه البيانات مطلقًا في صفحة الإهداء العامة.',
  },
  {
    title: 'المشاركة والروابط',
    body: 'كل من يملك رابط الإهداء النشط يستطيع رؤية الأسماء والرسالة. لا نعرض الإهداءات في فهرس عام، لكن ينبغي مشاركة الرابط مع من تثق به فقط.',
  },
  {
    title: 'الحذف',
    body: 'يستطيع المنشئ إيقاف صفحة الإهداء أو حذفها نهائيًا من شاشة الإدارة ما دامت جلسة الملكية متاحة. حذف بيانات التطبيق أو المتصفح قد يفقد الجلسة المجهولة وحق الإدارة.',
  },
  {
    title: 'ما لا نفعله',
    body: 'لا إعلانات، ولا تحليلات سلوكية، ولا ملفات تعريف إعلانية، ولا وصول إلى الموقع أو جهات الاتصال أو الهاتف.',
  },
];

export default function PrivacyScreen() {
  const theme = useAtharTheme();
  return (
    <Screen header={<AppHeader title="الخصوصية" back />}>
      <AppText variant="headline">خصوصيتك جزء من التصميم</AppText>
      <AppText color={theme.muted} style={styles.lead}>
        هذه سياسة موجزة للنسخة التجريبية من أثر، وآخر تحديث لها في ١ أغسطس ٢٠٢٦.
      </AppText>
      {sections.map((section) => (
        <Card key={section.title} style={styles.card}>
          <AppText variant="title">{section.title}</AppText>
          <AppText color={theme.textSoft}>{section.body}</AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginBottom: spacing.xl },
  card: { gap: spacing.xs, marginBottom: spacing.md },
});
