import type { QuranSurahFile } from '@/types/quran';

declare const require: (path: string) => unknown;

const loaders: Record<number, () => Promise<QuranSurahFile>> = {};
for (let number = 1; number <= 114; number += 1) {
  loaders[number] = async () => {
    const fileName = String(number).padStart(3, '0');
    return require('@/assets/quran/surahs/' + fileName + '.json') as QuranSurahFile;
  };
}

export const GENERATED_SURAH_LOADERS = Object.freeze(loaders);
