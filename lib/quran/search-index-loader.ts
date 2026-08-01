import type { QuranSearchIndexFile } from '@/types/quran';

export async function loadSearchIndex(): Promise<QuranSearchIndexFile> {
  const module = await import('../../assets/quran/search-index.json');
  return module.default as QuranSearchIndexFile;
}
