import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { radii, rtlRow, spacing, typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, helper, multiline, style, ...props },
  ref,
) {
  const theme = useAtharTheme();
  return (
    <View style={styles.wrapper}>
      <AppText variant="eyebrow">{label}</AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={helper}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        textAlign="right"
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
          },
          style,
        ]}
        {...props}
      />
      <View style={styles.metaRow}>
        {error ? (
          <AppText variant="small" color={theme.danger} accessibilityRole="alert">
            {error}
          </AppText>
        ) : helper ? (
          <AppText variant="small" color={theme.muted}>
            {helper}
          </AppText>
        ) : (
          <View />
        )}
        {typeof props.maxLength === 'number' && typeof props.value === 'string' ? (
          <AppText variant="small" color={theme.muted}>
            {props.value.length}/{props.maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.arabic,
    fontSize: 18,
    writingDirection: 'rtl',
  },
  multiline: { minHeight: 150, textAlignVertical: 'top' },
  metaRow: {
    minHeight: 24,
    flexDirection: rtlRow,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
