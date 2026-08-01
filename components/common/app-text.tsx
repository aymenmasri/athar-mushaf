import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

type AppTextVariant = 'body' | 'small' | 'eyebrow' | 'title' | 'headline' | 'display' | 'quran';

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: AppTextVariant;
    color?: string;
    align?: TextStyle['textAlign'];
    style?: StyleProp<TextStyle>;
  }
>;

export function AppText({
  children,
  variant = 'body',
  color,
  align = 'right',
  style,
  ...props
}: AppTextProps) {
  const theme = useAtharTheme();
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        { color: color ?? theme.text, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.arabic,
    writingDirection: 'rtl',
  },
  body: {
    fontSize: 18,
    lineHeight: 32,
  },
  small: {
    fontSize: 14,
    lineHeight: 24,
  },
  eyebrow: {
    fontFamily: typography.arabicBold,
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: typography.arabicBold,
    fontSize: 28,
    lineHeight: 42,
  },
  headline: {
    fontFamily: typography.arabicBold,
    fontSize: 38,
    lineHeight: 54,
  },
  display: {
    fontFamily: typography.arabicBold,
    fontSize: 64,
    lineHeight: 78,
  },
  quran: {
    fontSize: 30,
    lineHeight: 58,
  },
});
