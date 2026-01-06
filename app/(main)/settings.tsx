import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import { useUserStore } from '@/stores/use-user-store';
import { useTranslation } from 'react-i18next';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  type: 'navigation' | 'switch' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useUserStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  // Theme-aware Switch colors
  const switchTrackColorFalse = useCustomThemeColor({ light: '#767577', dark: '#555' });
  const switchTrackColorTrue = useCustomThemeColor({ light: '#4CAF50', dark: '#4CAF50' });
  const switchThumbColorInactive = useCustomThemeColor({ light: '#f4f3f4', dark: '#cccccc' });
  const switchThumbColorActive = useCustomThemeColor({ light: '#ffffff', dark: '#ffffff' });
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useCustomThemeColor({ light: '#ffffff', dark: '#1c1c1c' });
  const borderColor = useCustomThemeColor({ light: '#e1e1e1', dark: '#333' });

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutConfirm') || 'Logout',
      t('settings.logoutDescription') || 'Are you sure you want to logout?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('settings.logout') || 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount') || 'Delete Account',
      t('settings.deleteAccountWarning') || 'This action cannot be undone.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('settings.deleteAccount') || 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.featureNotAvailable') || 'Feature Not Available',
              t('settings.contactSupportToDelete') || 'Please contact support to delete your account.',
              [{ text: t('common.ok') || 'OK' }]
            );
          }
        }
      ]
    );
  };

  const settingsSections = [
    {
      title: t('settings.account'),
      items: [
        {
          id: 'profile',
          title: t('settings.personalInfo'),
          description: t('settings.personalInfoDescription'),
          icon: '👤',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              t('settings.featureNotAvailable') || 'Feature Not Available',
              t('settings.comingSoon') || 'Coming Soon',
              [{ text: t('common.ok') || 'OK' }]
            );
          }
        },
        {
          id: 'insurance',
          title: t('settings.insuranceInfo'),
          description: t('settings.insuranceInfoDescription'),
          icon: '🛡️',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.featureNotAvailable')),
              String(t('settings.comingSoon')),
              [{ text: String(t('common.ok')) }]
            );
          }
        },
        {
          id: 'emergency_contacts',
          title: t('settings.emergencyContacts'),
          description: t('settings.emergencyContactsDescription'),
          icon: '📞',
          type: 'navigation' as const,
          onPress: () => router.push('/emergency')
        }
      ]
    },
    {
      title: t('settings.app'),
      items: [
        {
          id: 'notifications',
          title: t('settings.notifications'),
          description: t('settings.notificationsDescription'),
          icon: '🔔',
          type: 'switch' as const,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled
        },
        {
          id: 'dark_mode',
          title: t('settings.darkMode'),
          description: t('settings.darkModeDescription'),
          icon: '🌙',
          type: 'switch' as const,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled
        },
        {
          id: 'auto_sync',
          title: t('settings.autoSync'),
          description: t('settings.autoSyncDescription'),
          icon: '🔄',
          type: 'switch' as const,
          value: autoSyncEnabled,
          onToggle: setAutoSyncEnabled
        },
        {
          id: 'language',
          title: t('settings.language'),
          description: t('settings.languageDescription'),
          icon: '🌍',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.featureNotAvailable')),
              String(t('settings.comingSoon')),
              [{ text: String(t('common.ok')) }]
            );
          }
        }
      ]
    },
    {
      title: t('settings.data'),
      items: [
        {
          id: 'export_data',
          title: t('settings.exportData'),
          description: t('settings.exportDataDescription'),
          icon: '📤',
          type: 'action' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.featureNotAvailable')),
              String(t('settings.comingSoon')),
              [{ text: String(t('common.ok')) }]
            );
          }
        },
        {
          id: 'clear_cache',
          title: t('settings.clearCache'),
          description: t('settings.clearCacheDescription'),
          icon: '🗑️',
          type: 'action' as const,
          onPress: () => {
            Alert.alert(
              t('settings.clearCache') || 'Clear Cache',
              t('settings.clearCacheConfirm') || 'Are you sure you want to clear the cache?',
              [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                  text: t('settings.clear') || 'Clear',
                  onPress: () => {
                    Alert.alert(
                      t('settings.cacheCleared') || 'Cache Cleared',
                      t('settings.cacheClearedDescription') || 'Application cache has been cleared',
                      [{ text: t('common.ok') || 'OK' }]
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    },
    {
      title: t('settings.support'),
      items: [
        {
          id: 'help',
          title: t('settings.help'),
          description: t('settings.helpDescription'),
          icon: '❓',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.featureNotAvailable')),
              String(t('settings.comingSoon')),
              [{ text: String(t('common.ok')) }]
            );
          }
        },
        {
          id: 'contact',
          title: t('settings.contactSupport'),
          description: t('settings.contactSupportDescription'),
          icon: '📧',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.featureNotAvailable')),
              String(t('settings.comingSoon')),
              [{ text: String(t('common.ok')) }]
            );
          }
        },
        {
          id: 'about',
          title: t('settings.about'),
          description: t('settings.aboutDescription'),
          icon: 'ℹ️',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              String(t('settings.about')),
              String(t('settings.appVersion')) + ': 1.0.0\n' +
              String(t('settings.buildNumber')) + ': 1\n\n' +
              String(t('settings.copyright')),
              [{ text: String(t('common.ok')) }]
            );
          }
        }
      ]
    },
    {
      title: t('settings.account'),
      items: [
        {
          id: 'logout',
          title: t('settings.logout'),
          description: t('settings.logoutDescription'),
          icon: '🚪',
          type: 'action' as const,
          destructive: true,
          onPress: handleLogout
        },
        {
          id: 'delete_account',
          title: t('settings.deleteAccount'),
          description: t('settings.deleteAccountDescription'),
          icon: '⚠️',
          type: 'action' as const,
          destructive: true,
          onPress: handleDeleteAccount
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { backgroundColor: cardBackgroundColor, borderColor }
        ]}
        onPress={item.onPress}
        activeOpacity={item.type === 'switch' ? 1 : 0.7}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingIcon}>
            <ThemedText style={styles.settingEmoji}>
              {item.icon}
            </ThemedText>
          </View>
          
          <View style={styles.settingText}>
            <ThemedText style={[
              styles.settingTitle,
              item.destructive && styles.destructiveText
            ]}>
              {item.title}
            </ThemedText>
            {item.description && (
              <ThemedText style={styles.settingDescription}>
                {item.description}
              </ThemedText>
            )}
          </View>
          
          {item.type === 'switch' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{
                false: switchTrackColorFalse,
                true: switchTrackColorTrue
              }}
              thumbColor={item.value ? switchThumbColorActive : switchThumbColorInactive}
            />
          )}
          
          {item.type === 'navigation' && (
            <ThemedText style={styles.chevron}>›</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          title={t('common.back')}
          onPress={() => router.back()}
          variant="secondary"
          style={styles.headerButton}
        />
        <ThemedText style={styles.headerTitle}>
          {t('settings.settings')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <View style={styles.profileAvatar}>
            <ThemedText style={styles.profileAvatarText}>
              {user?.profile?.name?.charAt(0)?.toUpperCase() || '👤'}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>
              {user?.profile?.name || String(t('settings.user'))}
            </ThemedText>
            <ThemedText style={styles.profileEmail}>
              {user?.profile?.email || String(t('settings.notLoggedIn'))}
            </ThemedText>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <View style={styles.sectionItems}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appVersion}>
            {t('settings.appName')} v1.0.0
          </ThemedText>
          <ThemedText style={styles.appBuild}>
            Build 1 - {t('settings.development')}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  headerButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 30,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
    opacity: 0.7,
  },
  sectionItems: {
    gap: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 32,
    marginRight: 15,
    alignItems: 'center',
  },
  settingEmoji: {
    fontSize: 20,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 18,
  },
  destructiveText: {
    color: '#F44336',
  },
  chevron: {
    fontSize: 20,
    opacity: 0.3,
    marginLeft: 10,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  appBuild: {
    fontSize: 12,
    opacity: 0.4,
  },
});
