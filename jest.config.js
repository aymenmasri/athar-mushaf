module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'providers/**/*.{ts,tsx}',
    '!lib/quran/generated/**',
  ],
  moduleNameMapper: {
    '^@/lib/quran/generated-surah-loaders$': '<rootDir>/tests/fixtures/quran-test-loaders.ts',
    '^@/lib/quran/search-index-loader$':
      '<rootDir>/tests/fixtures/quran-test-search-index-loader.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
