import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserStore } from '@/stores/use-user-store';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

export function UniversalLinkRestrictionBanner() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const borderColor = useThemeColor({ light: '#ffd60a', dark: '#ffc107' }, 'tint');
  const backgroundColor = useThemeColor({ light: '#fff3cd', dark: '#664d03' }, 'background');
  const textColor = useThemeColor({ light: '#664d03', dark: '#fff3cd' }, 'text');

  if (!user.universalLinkContext?.hasVehicleRestriction) {
    return null;
  }

  return (
    <ThemedView style={[styles.banner, { borderColor, backgroundColor }]}>
      <View style={styles.content}>
        <IconSymbol name="info.circle" size={20} color={textColor} />
        <ThemedText style={[styles.text, { color: textColor }]}>
          {t('vehicles.restrictedAccessMessage')}
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