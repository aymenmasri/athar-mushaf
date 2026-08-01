import searchIndex from '@/assets/quran/search-index.json';
import type { QuranSearchIndexFile } from '@/types/quran';

export async function loadSearchIndex(): Promise<QuranSearchIndexFile> {
  return searchIndex as QuranSearchIndexFile;
}
