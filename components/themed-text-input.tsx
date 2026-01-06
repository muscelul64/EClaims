import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
  lightPlaceholderColor?: string;
  darkPlaceholderColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  lightBorderColor,
  darkBorderColor,
  lightPlaceholderColor,
  darkPlaceholderColor,
  ...rest
}: ThemedTextInputProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor || '#fff', dark: darkColor || '#2c2c2c' }, 
    'background'
  );
  const borderColor = useThemeColor(
    { light: lightBorderColor || '#ddd', dark: darkBorderColor || '#555' }, 
    'icon'
  );
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor(
    { light: lightPlaceholderColor || '#999', dark: darkPlaceholderColor || '#888' }, 
    'icon'
  );

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor,
          borderColor,
          color: textColor,
        },
        style,
      ]}
      placeholderTextColor={placeholderColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
});