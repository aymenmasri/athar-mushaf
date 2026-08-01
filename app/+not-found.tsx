import { useRouter } from 'expo-router';

import { AppButton } from '@/components/common/app-button';
import { EmptyState } from '@/components/common/empty-state';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen header={<AppHeader back />}>
      <EmptyState
        icon="compass-outline"
        title="هذه الصفحة غير موجودة"
        message="ربما تغيّر الرابط أو لم تعد الصفحة متاحة."
      />
      <AppButton label="العودة إلى الرئيسية" onPress={() => router.replace('/')} />
    </Screen>
  );
}
