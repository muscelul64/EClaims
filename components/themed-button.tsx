import React from 'react';
import { StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedButtonProps = TouchableOpacityProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  title: string;
  textColor?: string;
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  variant = 'primary',
  title,
  textColor,
  ...rest
}: ThemedButtonProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');
  const secondaryBg = useThemeColor({ light: '#f0f0f0', dark: '#333333' }, 'background');
  
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: secondaryBg };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: backgroundColor };
      default:
        return { backgroundColor };
    }
  };

  const getTextColor = () => {
    if (textColor) return textColor;
    if (variant === 'outline' || variant === 'secondary') return backgroundColor;
    return 'white';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        style,
      ]}
      {...rest}
    >
      <ThemedText style={[styles.text, { color: getTextColor() }]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});