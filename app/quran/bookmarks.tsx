import { BookmarksList } from '@/components/quran/bookmarks-list';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';

export default function BookmarksScreen() {
  return (
    <Screen scroll={false} contentStyle={{ flex: 1 }} header={<AppHeader title="المفضلة" back />}>
      <BookmarksList />
    </Screen>
  );
}
