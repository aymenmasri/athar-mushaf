import { FlexStyle, Platform } from 'react-native';

export const palette = {
  evergreen: '#173E34',
  evergreenDeep: '#102C26',
  evergreenSoft: '#DDEAE3',
  ivory: '#FAF7EF',
  parchment: '#F3EDDE',
  white: '#FFFFFF',
  gold: '#AA8741',
  goldSoft: '#E8D8B0',
  ink: '#17201D',
  inkSoft: '#34413D',
  muted: '#68736E',
  border: '#DDD5C4',
  danger: '#9C3939',
  dangerSoft: '#F6E4E1',
  night: '#0E1B18',
  nightSurface: '#172824',
  nightText: '#F6F1E6',
  nightMuted: '#B9C2BE',
  nightBorder: '#344943',
} as const;

export type ColorTheme = {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSoft: string;
  muted: string;
  border: string;
  danger: string;
  dangerSoft: string;
  statusBar: 'light' | 'dark';
};

export const themes: Record<'light' | 'dark' | 'sepia', ColorTheme> = {
  light: {
    background: palette.ivory,
    surface: palette.white,
    surfaceMuted: '#F4F0E7',
    primary: palette.evergreen,
    primaryPressed: palette.evergreenDeep,
    primarySoft: palette.evergreenSoft,
    accent: palette.gold,
    accentSoft: palette.goldSoft,
    text: palette.ink,
    textSoft: palette.inkSoft,
    muted: palette.muted,
    border: palette.border,
    danger: palette.danger,
    dangerSoft: palette.dangerSoft,
    statusBar: 'dark',
  },
  sepia: {
    background: '#F1E8D5',
    surface: '#F9F2E3',
    surfaceMuted: '#E9DEC7',
    primary: '#315044',
    primaryPressed: '#243E35',
    primarySoft: '#D9E3D9',
    accent: '#967437',
    accentSoft: '#DFCAA0',
    text: '#2B2923',
    textSoft: '#4E4A40',
    muted: '#706A5F',
    border: '#D3C6AC',
    danger: palette.danger,
    dangerSoft: '#EFDDD5',
    statusBar: 'dark',
  },
  dark: {
    background: palette.night,
    surface: palette.nightSurface,
    surfaceMuted: '#1E312C',
    primary: '#D1E7DC',
    primaryPressed: '#B9D7C8',
    primarySoft: '#24483E',
    accent: '#D3B66F',
    accentSoft: '#493F28',
    text: palette.nightText,
    textSoft: '#DCE3DF',
    muted: palette.nightMuted,
    border: palette.nightBorder,
    danger: '#E98A84',
    dangerSoft: '#482A28',
    statusBar: 'light',
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 72,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 12px 36px rgba(23, 62, 52, 0.07)' },
    default: {
      shadowColor: palette.evergreenDeep,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
  }),
};

export const typography = {
  arabic: 'NotoNaskhArabic_400Regular',
  arabicMedium: 'NotoNaskhArabic_500Medium',
  arabicBold: 'NotoNaskhArabic_700Bold',
  system: Platform.select({
    web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: 'System',
  }),
} as const;

// Web already inherits `dir="rtl"`; native needs the explicit reverse order
// because the MVP stays Arabic even when the device locale is not.
export const rtlRow: FlexStyle['flexDirection'] = Platform.OS === 'web' ? 'row' : 'row-reverse';

// Compatibility with the small Expo template helpers that remain in the tree.
export const Colors = {
  light: {
    text: themes.light.text,
    background: themes.light.background,
    tint: themes.light.primary,
    icon: themes.light.muted,
    tabIconDefault: themes.light.muted,
    tabIconSelected: themes.light.primary,
  },
  dark: {
    text: themes.dark.text,
    background: themes.dark.background,
    tint: themes.dark.accent,
    icon: themes.dark.muted,
    tabIconDefault: themes.dark.muted,
    tabIconSelected: themes.dark.accent,
  },
};

export const Fonts = {
  sans: typography.system,
  serif: typography.arabic,
  rounded: typography.system,
  mono: Platform.select({ web: 'ui-monospace, monospace', default: 'monospace' }),
};
