#!/usr/bin/env node
// @ts-nocheck

/*
 * This file intentionally uses syntax understood by both Node.js 20 and
 * TypeScript. The import therefore needs no network access or script runner.
 * It never edits a Quran source file; it only reads pinned sources and writes
 * deterministic derived JSON.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');
const QURAN_ROOT = path.join(REPOSITORY_ROOT, 'assets', 'quran');
const SOURCE_RECEIPT_PATH = path.join(QURAN_ROOT, 'source-receipt.json');
const SURAH_OUTPUT_DIRECTORY = path.join(QURAN_ROOT, 'surahs');
const GENERATED_LOADER_PATH = path.join(
  REPOSITORY_ROOT,
  'lib',
  'quran',
  'generated-surah-loaders.ts',
);

const EXPECTED_AYAH_COUNT = 6236;
const EXPECTED_SURAH_COUNT = 114;

const EXPECTED_SOURCE_SHA256 = Object.freeze({
  'source/quran-uthmani.txt': '6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f',
  'source/quran-simple-clean.txt':
    '228df2a717671aeb9d2ff573002bd28d6b3f973f4bc7153554e3a81663d67610',
  'source/quran-data.xml': '8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a',
});

const DISPLAY_ATTRIBUTION = Object.freeze({
  name: 'Tanzil Quran Text',
  project: 'Tanzil Project',
  version: '1.1',
  textType: 'Uthmani',
  copyright: 'Copyright (C) 2007-2026 Tanzil Project',
  license: 'Creative Commons Attribution 3.0',
  sourceUrl: 'https://tanzil.net/',
  licenseUrl: 'https://tanzil.net/docs/Text_License',
});

const SEARCH_ATTRIBUTION = Object.freeze({
  ...DISPLAY_ATTRIBUTION,
  textType: 'Simple Clean',
});

function fail(message) {
  throw new Error('[Quran import] ' + message);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail('Cannot parse JSON at ' + filePath + ': ' + error.message);
  }
}

function decodeUtf8(buffer, label) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch (error) {
    fail(label + ' is not valid UTF-8: ' + error.message);
  }
}

function verifyAndReadSources() {
  const receipt = readJson(SOURCE_RECEIPT_PATH);

  if (receipt.schemaVersion !== 1 || receipt.project !== 'Tanzil Project') {
    fail('source-receipt.json has an unsupported schema or project.');
  }
  if (receipt.termsAccepted !== true) {
    fail('The Tanzil terms must be explicitly accepted in source-receipt.json.');
  }
  if (typeof receipt.retrievedAt !== 'string' || Number.isNaN(Date.parse(receipt.retrievedAt))) {
    fail('source-receipt.json must contain a valid retrieval timestamp.');
  }
  if (!Array.isArray(receipt.files) || receipt.files.length !== 3) {
    fail('source-receipt.json must describe exactly the three pinned sources.');
  }

  const receiptByPath = new Map(receipt.files.map((file) => [file.path, file]));
  const sourceBuffers = {};
  const sourceTexts = {};

  for (const [relativePath, expectedHash] of Object.entries(EXPECTED_SOURCE_SHA256)) {
    const receiptEntry = receiptByPath.get(relativePath);
    if (!receiptEntry) {
      fail('Missing receipt entry for ' + relativePath + '.');
    }
    if (receiptEntry.sha256 !== expectedHash) {
      fail('Receipt checksum is not the reviewed checksum for ' + relativePath + '.');
    }
    if (
      typeof receiptEntry.downloadUrl !== 'string' ||
      !receiptEntry.downloadUrl.startsWith('https://tanzil.net/')
    ) {
      fail('Source URL is not an official Tanzil HTTPS URL for ' + relativePath + '.');
    }

    const absolutePath = path.join(QURAN_ROOT, relativePath);
    let buffer;
    try {
      buffer = fs.readFileSync(absolutePath);
    } catch (error) {
      fail('Cannot read pinned source ' + relativePath + ': ' + error.message);
    }
    const actualHash = sha256(buffer);
    if (actualHash !== expectedHash) {
      fail(
        'Checksum mismatch for ' +
          relativePath +
          '. Expected ' +
          expectedHash +
          ', received ' +
          actualHash +
          '. Refusing to import.',
      );
    }
    sourceBuffers[relativePath] = buffer;
    sourceTexts[relativePath] = decodeUtf8(buffer, relativePath);
  }

  verifyCopyrightBlock(sourceTexts['source/quran-uthmani.txt'], 'Uthmani');
  verifyCopyrightBlock(sourceTexts['source/quran-simple-clean.txt'], 'Simple Clean');

  return { receipt, sourceBuffers, sourceTexts };
}

function verifyCopyrightBlock(text, textType) {
  const requiredFragments = [
    '# PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK',
    'Tanzil Quran Text (' + textType + ', Version 1.1)',
    'Copyright (C) 2007-2026 Tanzil Project',
    'License: Creative Commons Attribution 3.0',
    'Permission is granted to copy and distribute verbatim copies',
    'CHANGING IT IS NOT ALLOWED.',
    'provided that its source (Tanzil Project) is clearly indicated',
  ];
  for (const fragment of requiredFragments) {
    if (!text.includes(fragment)) {
      fail('The ' + textType + ' source is missing licence text: ' + fragment);
    }
  }
}

function parseNumberedText(text, label) {
  const entries = [];
  const coordinates = new Set();
  let dataHasEnded = false;

  for (const line of text.split(/\r?\n/u)) {
    if (line === '') {
      if (entries.length > 0) {
        dataHasEnded = true;
      }
      continue;
    }
    if (line.startsWith('#')) {
      dataHasEnded = true;
      continue;
    }
    if (dataHasEnded) {
      fail(label + ' contains non-comment content after the Quran data.');
    }

    const firstSeparator = line.indexOf('|');
    const secondSeparator = line.indexOf('|', firstSeparator + 1);
    if (firstSeparator <= 0 || secondSeparator <= firstSeparator + 1) {
      fail(label + ' has an invalid numbered line: ' + line.slice(0, 80));
    }

    const surahToken = line.slice(0, firstSeparator);
    const ayahToken = line.slice(firstSeparator + 1, secondSeparator);
    const quranText = line.slice(secondSeparator + 1);
    if (!/^\d+$/u.test(surahToken) || !/^\d+$/u.test(ayahToken)) {
      fail(label + ' contains a non-numeric surah or ayah coordinate.');
    }
    if (quranText.length === 0 || quranText.trim().length === 0) {
      fail(label + ' contains an empty ayah at ' + surahToken + ':' + ayahToken);
    }

    const surahNumber = Number(surahToken);
    const ayahNumber = Number(ayahToken);
    const coordinate = surahNumber + ':' + ayahNumber;
    if (coordinates.has(coordinate)) {
      fail(label + ' contains duplicate coordinate ' + coordinate + '.');
    }
    coordinates.add(coordinate);
    entries.push({ surahNumber, ayahNumber, text: quranText });
  }

  if (entries.length !== EXPECTED_AYAH_COUNT) {
    fail(label + ' contains ' + entries.length + ' ayahs; expected ' + EXPECTED_AYAH_COUNT + '.');
  }
  return entries;
}

function decodeXmlEntities(value) {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&')
    .replace(/&#(\d+);/gu, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([\da-f]+);/giu, (_, hexadecimal) =>
      String.fromCodePoint(Number.parseInt(hexadecimal, 16)),
    );
}

function parseAttributes(fragment) {
  const attributes = {};
  const attributePattern = /([a-z]+)="([^"]*)"/giu;
  let match;
  while ((match = attributePattern.exec(fragment)) !== null) {
    attributes[match[1]] = decodeXmlEntities(match[2]);
  }
  return attributes;
}

function parseSurahMetadata(xml) {
  if (
    !xml.includes('<quran type="metadata" version="1.0"') ||
    !xml.includes('<suras alias="chapters">')
  ) {
    fail('quran-data.xml is not Tanzil Quran metadata version 1.0.');
  }

  const surahs = [];
  const surahPattern = /<sura\s+([^>]+?)\s*\/>/gu;
  let match;
  while ((match = surahPattern.exec(xml)) !== null) {
    const attributes = parseAttributes(match[1]);
    const number = Number(attributes.index);
    const ayahCount = Number(attributes.ayas);
    const revelationType =
      attributes.type === 'Meccan'
        ? 'makkah'
        : attributes.type === 'Medinan'
          ? 'madinah'
          : undefined;

    if (
      !Number.isInteger(number) ||
      !Number.isInteger(ayahCount) ||
      !attributes.name ||
      !attributes.tname ||
      !attributes.ename ||
      !revelationType
    ) {
      fail('Invalid surah metadata element: ' + match[0]);
    }

    surahs.push({
      number,
      arabicName: attributes.name,
      transliteratedName: attributes.tname,
      englishName: attributes.ename,
      revelationType,
      ayahCount,
    });
  }

  if (surahs.length !== EXPECTED_SURAH_COUNT) {
    fail(
      'quran-data.xml contains ' +
        surahs.length +
        ' surahs; expected ' +
        EXPECTED_SURAH_COUNT +
        '.',
    );
  }
  surahs.forEach((surah, index) => {
    if (surah.number !== index + 1) {
      fail('Surah metadata numbering is not continuous at index ' + index + '.');
    }
  });
  if (surahs[0].arabicName !== 'الفاتحة') {
    fail('The first surah in metadata is not سورة الفاتحة.');
  }
  if (surahs[113].arabicName !== 'الناس') {
    fail('The last surah in metadata is not سورة الناس.');
  }

  return surahs;
}

function parsePartitionMetadata(xml, containerTag, itemTag, expectedCount, label) {
  const containerPattern = new RegExp(
    '<' + containerTag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + containerTag + '>',
    'u',
  );
  const containerMatch = xml.match(containerPattern);
  if (!containerMatch) {
    fail('quran-data.xml is missing the official ' + label + ' boundaries.');
  }

  const boundaries = [];
  const itemPattern = new RegExp('<' + itemTag + '\\s+([^>]+?)\\s*/>', 'gu');
  let match;
  while ((match = itemPattern.exec(containerMatch[1])) !== null) {
    const attributes = parseAttributes(match[1]);
    const number = Number(attributes.index);
    const startSurahNumber = Number(attributes.sura);
    const startAyahNumber = Number(attributes.aya);
    if (
      !Number.isInteger(number) ||
      !Number.isInteger(startSurahNumber) ||
      !Number.isInteger(startAyahNumber)
    ) {
      fail('Invalid ' + label + ' boundary: ' + match[0]);
    }
    boundaries.push({ number, startSurahNumber, startAyahNumber });
  }

  if (boundaries.length !== expectedCount) {
    fail(
      'quran-data.xml contains ' +
        boundaries.length +
        ' ' +
        label +
        ' boundaries; expected ' +
        expectedCount +
        '.',
    );
  }
  boundaries.forEach((boundary, index) => {
    if (boundary.number !== index + 1) {
      fail(label + ' numbering is not continuous at index ' + index + '.');
    }
  });
  if (boundaries[0].startSurahNumber !== 1 || boundaries[0].startAyahNumber !== 1) {
    fail('The first ' + label + ' boundary must start at 1:1.');
  }
  return boundaries;
}

function parseJuzMetadata(xml) {
  return parsePartitionMetadata(xml, 'juzs', 'juz', 30, 'juz');
}

function parsePageMetadata(xml) {
  return parsePartitionMetadata(xml, 'pages', 'page', 604, 'page');
}

function buildPartitionAssignments(entries, boundaries, label) {
  const assignments = [];
  let boundaryIndex = 0;
  let currentNumber;

  for (const entry of entries) {
    const boundary = boundaries[boundaryIndex];
    if (
      boundary &&
      boundary.startSurahNumber === entry.surahNumber &&
      boundary.startAyahNumber === entry.ayahNumber
    ) {
      currentNumber = boundary.number;
      boundaryIndex += 1;
    }
    if (!currentNumber) {
      fail('No ' + label + ' assignment is defined for Quran coordinate 1:1.');
    }
    assignments.push(currentNumber);
  }

  if (boundaryIndex !== boundaries.length) {
    const boundary = boundaries[boundaryIndex];
    fail(
      'The ' +
        label +
        ' boundary ' +
        boundary.number +
        ' points to a Quran coordinate that does not exist.',
    );
  }
  return assignments;
}

function validateCoordinates(displayEntries, searchEntries, surahMetadata) {
  if (displayEntries.length !== searchEntries.length) {
    fail('Display and search editions do not contain the same number of ayahs.');
  }

  for (let index = 0; index < displayEntries.length; index += 1) {
    const display = displayEntries[index];
    const search = searchEntries[index];
    if (display.surahNumber !== search.surahNumber || display.ayahNumber !== search.ayahNumber) {
      fail('Display/search coordinate mismatch at source line ' + (index + 1) + '.');
    }
  }

  let sourceIndex = 0;
  for (const metadata of surahMetadata) {
    for (let ayahNumber = 1; ayahNumber <= metadata.ayahCount; ayahNumber += 1) {
      const entry = displayEntries[sourceIndex];
      if (!entry || entry.surahNumber !== metadata.number || entry.ayahNumber !== ayahNumber) {
        fail(
          'Expected continuous coordinate ' +
            metadata.number +
            ':' +
            ayahNumber +
            ' at source line ' +
            (sourceIndex + 1) +
            '.',
        );
      }
      sourceIndex += 1;
    }
  }
  if (sourceIndex !== EXPECTED_AYAH_COUNT) {
    fail('Metadata ayah totals do not equal 6,236.');
  }
}

function validateBasmalaRepresentation(displayEntries) {
  const firstAyahs = new Map(
    displayEntries
      .filter((entry) => entry.ayahNumber === 1)
      .map((entry) => [entry.surahNumber, entry.text]),
  );
  const basmala = firstAyahs.get(1);
  if (!basmala) {
    fail('Al-Fatiha 1:1 is missing.');
  }
  // Tanzil preserves contextual Uthmani marks (for example an additional
  // shadda on the initial ba in 95:1 and 97:1). Compare only for this
  // structural assertion; the value written to JSON remains byte-for-byte
  // the source string.
  const withoutArabicMarks = (value) =>
    value.replace(/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/giu, '');
  const comparableBasmala = withoutArabicMarks(basmala);

  for (let surahNumber = 2; surahNumber <= EXPECTED_SURAH_COUNT; surahNumber += 1) {
    const firstAyah = firstAyahs.get(surahNumber);
    if (!firstAyah) {
      fail('Missing first ayah for surah ' + surahNumber + '.');
    }
    const comparableFirstAyah = withoutArabicMarks(firstAyah);
    if (surahNumber === 9) {
      if (
        comparableFirstAyah === comparableBasmala ||
        comparableFirstAyah.startsWith(comparableBasmala + ' ')
      ) {
        fail('At-Tawbah 9:1 unexpectedly has a basmala prefix.');
      }
    } else if (!comparableFirstAyah.startsWith(comparableBasmala + ' ')) {
      fail('Surah ' + surahNumber + ":1 is missing Tanzil's basmala prefix.");
    }
  }
}

function writeFileAtomically(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = filePath + '.tmp';
  fs.writeFileSync(temporaryPath, value);
  fs.renameSync(temporaryPath, filePath);
}

function writeJson(filePath, value) {
  writeFileAtomically(filePath, JSON.stringify(value, null, 2) + '\n');
}

function padSurahNumber(number) {
  return String(number).padStart(3, '0');
}

function buildGeneratedLoader() {
  const lines = [
    '/* This file is generated by scripts/import-quran.ts. Do not edit manually. */',
    '',
    "import type { QuranSurahFile } from '@/types/quran';",
    '',
    'const unwrap = (module: unknown): QuranSurahFile =>',
    '  (module as { default: QuranSurahFile }).default;',
    '',
    'export const GENERATED_SURAH_LOADERS: Readonly<Record<number, () => Promise<QuranSurahFile>>> =',
    '  Object.freeze({',
  ];
  for (let number = 1; number <= EXPECTED_SURAH_COUNT; number += 1) {
    const fileName = padSurahNumber(number) + '.json';
    lines.push(
      '    ' +
        number +
        ": () => import('../../assets/quran/surahs/" +
        fileName +
        "').then(unwrap),",
    );
  }
  lines.push('  });', '');
  return lines.join('\n');
}

function generateCorpus(
  receipt,
  displayEntries,
  searchEntries,
  surahMetadata,
  juzMetadata,
  pageMetadata,
  juzAssignments,
  pageAssignments,
) {
  fs.mkdirSync(SURAH_OUTPUT_DIRECTORY, { recursive: true });

  let sourceIndex = 0;
  for (const metadata of surahMetadata) {
    const sourceVerses = displayEntries.slice(sourceIndex, sourceIndex + metadata.ayahCount);
    const verses = sourceVerses.map((entry, localIndex) => ({
      surahNumber: entry.surahNumber,
      ayahNumber: entry.ayahNumber,
      uthmaniText: entry.text,
      juzNumber: juzAssignments[sourceIndex + localIndex],
      pageNumber: pageAssignments[sourceIndex + localIndex],
    }));
    const surahFile = {
      schemaVersion: 1,
      source: DISPLAY_ATTRIBUTION,
      surah: {
        ...metadata,
        verses,
      },
    };
    writeJson(
      path.join(SURAH_OUTPUT_DIRECTORY, padSurahNumber(metadata.number) + '.json'),
      surahFile,
    );
    sourceIndex += metadata.ayahCount;
  }

  const unexpectedSurahFiles = fs
    .readdirSync(SURAH_OUTPUT_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.json') && !/^\d{3}\.json$/u.test(fileName));
  if (unexpectedSurahFiles.length > 0) {
    fail(
      'Unexpected JSON files in the generated surah directory: ' + unexpectedSurahFiles.join(', '),
    );
  }

  const searchIndex = {
    schemaVersion: 1,
    source: SEARCH_ATTRIBUTION,
    entries: searchEntries.map((entry) => ({
      surahNumber: entry.surahNumber,
      ayahNumber: entry.ayahNumber,
      searchableText: entry.text,
    })),
  };
  writeJson(path.join(QURAN_ROOT, 'search-index.json'), searchIndex);

  const metadataFile = {
    schemaVersion: 1,
    generatedAt: receipt.retrievedAt,
    generator: 'scripts/import-quran.ts',
    source: {
      project: 'Tanzil Project',
      sourceUrl: 'https://tanzil.net/',
      downloadPageUrl: 'https://tanzil.net/download/',
      license: 'Creative Commons Attribution 3.0',
      licenseUrl: 'https://tanzil.net/docs/Text_License',
      files: receipt.files.map((file) => ({
        role: file.role,
        path: file.path,
        sha256: file.sha256,
        textType: file.textType,
        version: file.version,
        downloadUrl: file.downloadUrl,
      })),
    },
    basmala: {
      representation: 'Verbatim Tanzil numbered-text representation; never split or inserted.',
      alFatiha: 'Al-Fatiha 1:1 consists of the basmala.',
      otherSurahs:
        'For every surah except Al-Fatiha and At-Tawbah, the basmala prefixes ayah 1 on the same source line and is not an additional ayah.',
      atTawbah: 'At-Tawbah 9:1 has no basmala prefix.',
    },
    statistics: {
      surahCount: EXPECTED_SURAH_COUNT,
      ayahCount: EXPECTED_AYAH_COUNT,
      juzCount: 30,
      pageCount: 604,
    },
    surahs: surahMetadata,
    juzs: juzMetadata,
    pages: pageMetadata,
  };
  writeJson(path.join(QURAN_ROOT, 'surah-metadata.json'), metadataFile);
  writeFileAtomically(GENERATED_LOADER_PATH, buildGeneratedLoader());
}

function buildIntegrityManifest(generatedAt) {
  const relativePaths = [
    'search-index.json',
    'source-receipt.json',
    'source/quran-data.xml',
    'source/quran-simple-clean.txt',
    'source/quran-uthmani.txt',
    'surah-metadata.json',
  ];
  for (let number = 1; number <= EXPECTED_SURAH_COUNT; number += 1) {
    relativePaths.push('surahs/' + padSurahNumber(number) + '.json');
  }
  relativePaths.sort();

  const files = relativePaths.map((relativePath) => {
    const buffer = fs.readFileSync(path.join(QURAN_ROOT, relativePath));
    return {
      path: relativePath,
      bytes: buffer.byteLength,
      sha256: sha256(buffer),
    };
  });
  const corpusDigestInput =
    files.map((file) => file.path + '\0' + file.bytes + '\0' + file.sha256).join('\n') + '\n';
  const integrity = {
    schemaVersion: 1,
    algorithm: 'SHA-256',
    generatedAt,
    files,
    corpusSha256: sha256(Buffer.from(corpusDigestInput, 'utf8')),
  };
  writeJson(path.join(QURAN_ROOT, 'integrity.json'), integrity);
  return integrity;
}

function importQuran() {
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
  const surahMetadata = parseSurahMetadata(metadataXml);
  const juzMetadata = parseJuzMetadata(metadataXml);
  const pageMetadata = parsePageMetadata(metadataXml);

  validateCoordinates(displayEntries, searchEntries, surahMetadata);
  validateBasmalaRepresentation(displayEntries);
  const juzAssignments = buildPartitionAssignments(displayEntries, juzMetadata, 'juz');
  const pageAssignments = buildPartitionAssignments(displayEntries, pageMetadata, 'page');
  generateCorpus(
    receipt,
    displayEntries,
    searchEntries,
    surahMetadata,
    juzMetadata,
    pageMetadata,
    juzAssignments,
    pageAssignments,
  );
  const integrity = buildIntegrityManifest(receipt.retrievedAt);

  console.log(
    'Imported ' + EXPECTED_AYAH_COUNT + ' ayahs into ' + EXPECTED_SURAH_COUNT + ' surah files.',
  );
  console.log('Corpus SHA-256: ' + integrity.corpusSha256);
}

module.exports = {
  DISPLAY_ATTRIBUTION,
  EXPECTED_AYAH_COUNT,
  EXPECTED_SOURCE_SHA256,
  EXPECTED_SURAH_COUNT,
  QURAN_ROOT,
  SEARCH_ATTRIBUTION,
  SOURCE_RECEIPT_PATH,
  padSurahNumber,
  buildPartitionAssignments,
  parseJuzMetadata,
  parseNumberedText,
  parsePageMetadata,
  parseSurahMetadata,
  sha256,
  validateBasmalaRepresentation,
  validateCoordinates,
  verifyAndReadSources,
};

if (require.main === module) {
  try {
    importQuran();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
