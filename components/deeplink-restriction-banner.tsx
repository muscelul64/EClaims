import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserStore } from '@/stores/use-user-store';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

export function DeeplinkRestrictionBanner() {
  const { user } = useUserStore();
  const borderColor = useThemeColor({ light: '#ffd60a', dark: '#ffc107' });
  const backgroundColor = useThemeColor({ light: '#fff3cd', dark: '#664d03' });
  const textColor = useThemeColor({ light: '#664d03', dark: '#fff3cd' });

  if (!user.deeplinkContext?.hasVehicleRestriction) {
    return null;
  }

  return (
    <ThemedView style={[styles.banner, { borderColor, backgroundColor }]}>
      <View style={styles.content}>
        <IconSymbol name="info.circle" size={20} color={textColor} />
        <ThemedText style={[styles.text, { color: textColor }]}>
          Restricted access: Only 1 vehicle available via shared link
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});