#!/usr/bin/env node
// @ts-nocheck

/*
 * Offline integrity validator for the generated Quran corpus.
 *
 * It validates both directions:
 *   pinned Tanzil sources -> generated values (exact string equality), and
 *   generated files -> pinned integrity manifest (byte-level SHA-256).
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  DISPLAY_ATTRIBUTION,
  EXPECTED_AYAH_COUNT,
  EXPECTED_SURAH_COUNT,
  QURAN_ROOT,
  SEARCH_ATTRIBUTION,
  buildPartitionAssignments,
  padSurahNumber,
  parseJuzMetadata,
  parseNumberedText,
  parsePageMetadata,
  parseSurahMetadata,
  sha256,
  validateBasmalaRepresentation,
  validateCoordinates,
  verifyAndReadSources,
} = require('./import-quran.ts');

const EXPECTED_CORPUS_SHA256 = '8ee5a5a6c5cedf6ffc377131be8ead787dc046f5a896c1cdd13fd39d01084f2c';

function fail(message) {
  throw new Error('[Quran validation] ' + message);
}

function readJson(relativePath) {
  const absolutePath = path.join(QURAN_ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail('Cannot parse ' + relativePath + ': ' + error.message);
  }
}

function assertJsonEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(label + ' does not match the pinned Tanzil source.');
  }
}

function validateMetadataFile(
  metadataFile,
  receipt,
  sourceMetadata,
  sourceJuzMetadata,
  sourcePageMetadata,
) {
  if (metadataFile.schemaVersion !== 1 || metadataFile.generator !== 'scripts/import-quran.ts') {
    fail('surah-metadata.json has an unsupported schema or generator.');
  }
  if (metadataFile.generatedAt !== receipt.retrievedAt) {
    fail('surah-metadata.json does not use the reviewed import timestamp.');
  }
  if (
    metadataFile.statistics?.surahCount !== EXPECTED_SURAH_COUNT ||
    metadataFile.statistics?.ayahCount !== EXPECTED_AYAH_COUNT ||
    metadataFile.statistics?.juzCount !== 30 ||
    metadataFile.statistics?.pageCount !== 604
  ) {
    fail('Corpus statistics must be 114 surahs, 6,236 ayahs, 30 juzs, and 604 pages.');
  }
  if (!Array.isArray(metadataFile.surahs)) {
    fail('surah-metadata.json is missing its surah list.');
  }
  assertJsonEqual(metadataFile.surahs, sourceMetadata, 'Surah metadata');
  assertJsonEqual(metadataFile.juzs, sourceJuzMetadata, 'Juz metadata');
  assertJsonEqual(metadataFile.pages, sourcePageMetadata, 'Page metadata');

  const declaredSourceHashes = new Map(
    (metadataFile.source?.files || []).map((file) => [file.path, file.sha256]),
  );
  for (const file of receipt.files) {
    if (declaredSourceHashes.get(file.path) !== file.sha256) {
      fail('surah-metadata.json has a wrong source checksum for ' + file.path + '.');
    }
  }
}

function validateSearchIndex(searchIndex, sourceEntries) {
  if (searchIndex.schemaVersion !== 1) {
    fail('search-index.json has an unsupported schema.');
  }
  assertJsonEqual(searchIndex.source, SEARCH_ATTRIBUTION, 'Search attribution');
  if (!Array.isArray(searchIndex.entries) || searchIndex.entries.length !== EXPECTED_AYAH_COUNT) {
    fail('Search index must contain exactly 6,236 entries.');
  }

  for (let index = 0; index < sourceEntries.length; index += 1) {
    const actual = searchIndex.entries[index];
    const expected = sourceEntries[index];
    if (
      actual.surahNumber !== expected.surahNumber ||
      actual.ayahNumber !== expected.ayahNumber ||
      actual.searchableText !== expected.text
    ) {
      fail(
        'Search entry ' +
          expected.surahNumber +
          ':' +
          expected.ayahNumber +
          ' is not verbatim Tanzil Simple Clean text.',
      );
    }
    if ('uthmaniText' in actual) {
      fail('The search index must not duplicate or replace display text.');
    }
  }
}

function validateSurahFiles(
  sourceEntries,
  sourceMetadata,
  expectedJuzAssignments,
  expectedPageAssignments,
) {
  const directory = path.join(QURAN_ROOT, 'surahs');
  const actualFileNames = fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  const expectedFileNames = Array.from(
    { length: EXPECTED_SURAH_COUNT },
    (_, index) => padSurahNumber(index + 1) + '.json',
  );
  assertJsonEqual(actualFileNames, expectedFileNames, 'Generated surah file list');

  const seenSurahs = new Set();
  let sourceIndex = 0;
  for (const metadata of sourceMetadata) {
    const relativePath = 'surahs/' + padSurahNumber(metadata.number) + '.json';
    const generatedFile = readJson(relativePath);
    const surah = generatedFile.surah;

    if (generatedFile.schemaVersion !== 1) {
      fail(relativePath + ' has an unsupported schema.');
    }
    assertJsonEqual(generatedFile.source, DISPLAY_ATTRIBUTION, relativePath + ' attribution');
    if (!surah || seenSurahs.has(surah.number)) {
      fail(relativePath + ' is missing a surah or duplicates a surah number.');
    }
    seenSurahs.add(surah.number);

    const actualMetadata = {
      number: surah.number,
      arabicName: surah.arabicName,
      transliteratedName: surah.transliteratedName,
      englishName: surah.englishName,
      revelationType: surah.revelationType,
      ayahCount: surah.ayahCount,
    };
    assertJsonEqual(actualMetadata, metadata, relativePath + ' metadata');

    if (!Array.isArray(surah.verses) || surah.verses.length !== metadata.ayahCount) {
      fail(relativePath + ' ayah count does not match metadata.');
    }

    const seenAyahs = new Set();
    for (let ayahIndex = 0; ayahIndex < surah.verses.length; ayahIndex += 1) {
      const verse = surah.verses[ayahIndex];
      const expected = sourceEntries[sourceIndex];
      const expectedAyahNumber = ayahIndex + 1;
      if (
        verse.surahNumber !== metadata.number ||
        verse.ayahNumber !== expectedAyahNumber ||
        seenAyahs.has(verse.ayahNumber)
      ) {
        fail(relativePath + ' has duplicate or discontinuous ayah numbering.');
      }
      seenAyahs.add(verse.ayahNumber);
      if (
        !expected ||
        expected.surahNumber !== verse.surahNumber ||
        expected.ayahNumber !== verse.ayahNumber ||
        expected.text !== verse.uthmaniText ||
        verse.juzNumber !== expectedJuzAssignments[sourceIndex] ||
        verse.pageNumber !== expectedPageAssignments[sourceIndex]
      ) {
        fail(
          relativePath +
            ' ayah ' +
            verse.ayahNumber +
            ' does not match verbatim Tanzil Uthmani text and partition metadata.',
        );
      }
      if (typeof verse.uthmaniText !== 'string' || verse.uthmaniText.trim().length === 0) {
        fail(relativePath + ' contains an empty ayah.');
      }
      if (/lorem|placeholder|demo|fake|نص تجريبي|آية تجريبية/iu.test(verse.uthmaniText)) {
        fail(relativePath + ' contains demonstration or placeholder content.');
      }
      sourceIndex += 1;
    }
  }

  if (seenSurahs.size !== EXPECTED_SURAH_COUNT || sourceIndex !== EXPECTED_AYAH_COUNT) {
    fail('Generated corpus is not exactly 114 surahs and 6,236 ayahs.');
  }
}

function validateIntegrityManifest(receipt) {
  const integrity = readJson('integrity.json');
  if (integrity.schemaVersion !== 1 || integrity.algorithm !== 'SHA-256') {
    fail('integrity.json has an unsupported schema or hash algorithm.');
  }
  if (integrity.generatedAt !== receipt.retrievedAt) {
    fail('integrity.json does not use the reviewed import timestamp.');
  }
  if (integrity.corpusSha256 !== EXPECTED_CORPUS_SHA256) {
    fail(
      'Corpus checksum changed. Expected ' +
        EXPECTED_CORPUS_SHA256 +
        ', received ' +
        integrity.corpusSha256 +
        '.',
    );
  }
  if (!Array.isArray(integrity.files)) {
    fail('integrity.json is missing its file list.');
  }

  const expectedPaths = [
    'search-index.json',
    'source-receipt.json',
    'source/quran-data.xml',
    'source/quran-simple-clean.txt',
    'source/quran-uthmani.txt',
    'surah-metadata.json',
    ...Array.from(
      { length: EXPECTED_SURAH_COUNT },
      (_, index) => 'surahs/' + padSurahNumber(index + 1) + '.json',
    ),
  ].sort();
  const manifestPaths = integrity.files.map((file) => file.path);
  assertJsonEqual(manifestPaths, expectedPaths, 'Integrity manifest file list');

  for (const file of integrity.files) {
    const buffer = fs.readFileSync(path.join(QURAN_ROOT, file.path));
    if (buffer.byteLength !== file.bytes) {
      fail('Byte length changed for ' + file.path + '.');
    }
    const actualHash = sha256(buffer);
    if (actualHash !== file.sha256) {
      fail(
        'SHA-256 mismatch for ' +
          file.path +
          '. Expected ' +
          file.sha256 +
          ', received ' +
          actualHash +
          '.',
      );
    }
  }

  const digestInput =
    integrity.files.map((file) => file.path + '\0' + file.bytes + '\0' + file.sha256).join('\n') +
    '\n';
  const recomputedCorpusHash = sha256(Buffer.from(digestInput, 'utf8'));
  if (recomputedCorpusHash !== integrity.corpusSha256) {
    fail('The aggregate corpus checksum is internally inconsistent.');
  }
}

function validateQuranCorpus() {
  const { receipt, sourceTexts } = verifyAndReadSources();
  const displayEntries = parseNumberedText(
    sourceTexts['source/quran-uthmani.txt'],
    'Tanzil Uthmani source',
  );
  const searchEntries = parseNumberedText(
    sourceTexts['source/quran-simple-clean.txt'],
    'Tanzil Simple Clean source',
  );
  const metadataXml = sourceTexts['source/quran-data.xml'];
  const sourceMetadata = parseSurahMetadata(metadataXml);
  const sourceJuzMetadata = parseJuzMetadata(metadataXml);
  const sourcePageMetadata = parsePageMetadata(metadataXml);

  validateCoordinates(displayEntries, searchEntries, sourceMetadata);
  validateBasmalaRepresentation(displayEntries);
  const expectedJuzAssignments = buildPartitionAssignments(
    displayEntries,
    sourceJuzMetadata,
    'juz',
  );
  const expectedPageAssignments = buildPartitionAssignments(
    displayEntries,
    sourcePageMetadata,
    'page',
  );
  validateMetadataFile(
    readJson('surah-metadata.json'),
    receipt,
    sourceMetadata,
    sourceJuzMetadata,
    sourcePageMetadata,
  );
  validateSearchIndex(readJson('search-index.json'), searchEntries);
  validateSurahFiles(
    displayEntries,
    sourceMetadata,
    expectedJuzAssignments,
    expectedPageAssignments,
  );
  validateIntegrityManifest(receipt);

  return {
    surahCount: EXPECTED_SURAH_COUNT,
    ayahCount: EXPECTED_AYAH_COUNT,
    corpusSha256: EXPECTED_CORPUS_SHA256,
  };
}

module.exports = {
  EXPECTED_CORPUS_SHA256,
  validateQuranCorpus,
};

if (require.main === module) {
  try {
    const result = validateQuranCorpus();
    console.log('Validated ' + result.surahCount + ' surahs and ' + result.ayahCount + ' ayahs.');
    console.log('Corpus SHA-256: ' + result.corpusSha256);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
