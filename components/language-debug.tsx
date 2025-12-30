import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

export function LanguageDebug() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.1)', margin: 10 }}>
      <ThemedText>Debug Info:</ThemedText>
      <ThemedText>Current Language: {i18n.language}</ThemedText>
      <ThemedText>Initialized: {i18n.isInitialized ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>Test Translation: {t('main.title')}</ThemedText>
      
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity 
          onPress={() => changeLanguage('en')}
          style={{ padding: 5, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <ThemedText style={{ color: 'white' }}>English</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => changeLanguage('ro')}
          style={{ padding: 5, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <ThemedText style={{ color: 'white' }}>Română</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}