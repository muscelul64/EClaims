import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

type MenuOption = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  route: string;
  color: string;        
};

const menuOptions: MenuOption[] = [
  {
    id: 'new-statement',
    titleKey: 'main.newStatement.title',
    subtitleKey: 'main.newStatement.subtitle',
    icon: 'add-circle',
    route: '/(main)/statements/new',
    color: '#007AFF',
  },
  {
    id: 'vehicles',
    titleKey: 'main.vehicles.title',
    subtitleKey: 'main.vehicles.subtitle',
    icon: 'car',
    route: '/(main)/vehicles',
    color: '#34C759',
  },
  {
    id: 'damage',
    titleKey: 'main.damage.title', 
    subtitleKey: 'main.damage.subtitle',
    icon: 'camera',
    route: '/(main)/damage',
    color: '#FF9500',
  },
];

export default function MainScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' });
  const buildCardBg = useThemeColor({ light: '#f8f9fa', dark: '#1a1a1a' });

  const handleMenuPress = (option: MenuOption) => {
    router.push(option.route as any);
  };

  const handleLogout = () => {
    Alert.alert(
      t('main.logoutConfirmTitle') || 'Logout',
      t('main.logoutConfirmMessage') || 'Are you sure you want to log out?',
      [
        { text: t('main.cancel') || 'Cancel', style: 'cancel' },
        { text: t('main.logout') || 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('main.title') || 'Porsche E-Claims'}</ThemedText>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>{t('main.logout') || 'Logout'}</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.menuGrid}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleMenuPress(option)}
            >
              <ThemedView
                style={[styles.menuCard, { borderColor: option.color }]}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                  <IconSymbol 
                    name={option.icon as any} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.menuTitle}>
                  {t(option.titleKey) || 'Menu Option'}
                </ThemedText>
                <ThemedText style={styles.menuSubtitle}>
                  {t(option.subtitleKey) || 'Description'}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>        
        {/* Build Info Card */}
        <ThemedView style={[styles.buildCard, { backgroundColor: buildCardBg, borderColor }]}>
          <View style={styles.buildInfo}>
            <IconSymbol name="gear" size={16} color={useThemeColor({ light: '#666', dark: '#999' })} />
            <ThemedText style={styles.buildText}>
              v1.0.0 (Build 5)
            </ThemedText>
          </View>
        </ThemedView>      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuGrid: {
    gap: 20,
  },
  menuCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  menuSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  buildCard: {
    marginTop: 30,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buildInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buildText: {
    fontSize: 12,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
});