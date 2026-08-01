import { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
  NotoNaskhArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-naskh-arabic';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { themes } from '@/constants/theme';
import { ReadingProvider, useReading } from '@/providers/reading-provider';

void SplashScreen.preventAutoHideAsync();
I18nManager.allowRTL(true);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
  document.body.style.margin = '0';
}

function NavigationShell() {
  const { preferences } = useReading();
  const colors = themes[preferences.theme];
  const navigationTheme = preferences.theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: colors.background,
          card: colors.surface,
          border: colors.border,
          text: colors.text,
          primary: colors.primary,
        },
      }}
    >
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create-dedication" />
        <Stack.Screen name="dedication/[slug]" />
        <Stack.Screen name="manage/[slug]" />
        <Stack.Screen name="quran/index" />
        <Stack.Screen name="quran/surah/[surahNumber]" />
        <Stack.Screen name="quran/juz/[juzNumber]" />
        <Stack.Screen name="quran/search" />
        <Stack.Screen name="quran/bookmarks" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="about" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colors.statusBar} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_500Medium,
    NotoNaskhArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ReadingProvider>
        <NavigationShell />
      </ReadingProvider>
    </SafeAreaProvider>
  );
}
