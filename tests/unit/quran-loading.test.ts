type QuranModule = typeof import('@/lib/quran');

async function withInstrumentedLoaders(
  run: (quran: QuranModule, loadedSurahs: number[]) => Promise<void>,
) {
  jest.resetModules();
  const loadedSurahs: number[] = [];
  const loaders: Record<number, () => Promise<unknown>> = {};
  for (let number = 1; number <= 114; number += 1) {
    loaders[number] = () => {
      loadedSurahs.push(number);
      const fileName = String(number).padStart(3, '0');
      return Promise.resolve(require('@/assets/quran/surahs/' + fileName + '.json'));
    };
  }
  jest.doMock('@/lib/quran/generated-surah-loaders', () => ({
    GENERATED_SURAH_LOADERS: loaders,
  }));
  await jest.isolateModulesAsync(async () => {
    await run(require('@/lib/quran') as QuranModule, loadedSurahs);
  });
  jest.dontMock('@/lib/quran/generated-surah-loaders');
}

describe('Quran partition chunk loading', () => {
  it('loads only Al-Fatiha for Medina page 1', async () => {
    await withInstrumentedLoaders(async (quran, loadedSurahs) => {
      await expect(quran.getPage(1)).resolves.toHaveLength(7);
      expect(loadedSurahs).toEqual([1]);
    });
  });

  it('loads only the surahs that span Medina page 604', async () => {
    await withInstrumentedLoaders(async (quran, loadedSurahs) => {
      expect((await quran.getPage(604)).at(0)).toMatchObject({
        surahNumber: 112,
        ayahNumber: 1,
      });
      expect(loadedSurahs).toEqual([112, 113, 114]);
    });
  });

  it('loads only the surahs that span juz 1', async () => {
    await withInstrumentedLoaders(async (quran, loadedSurahs) => {
      const verses = await quran.getJuz(1);
      expect(verses.at(0)).toMatchObject({ surahNumber: 1, ayahNumber: 1 });
      expect(verses.at(-1)).toMatchObject({ surahNumber: 2, ayahNumber: 141 });
      expect(loadedSurahs).toEqual([1, 2]);
    });
  });
});
