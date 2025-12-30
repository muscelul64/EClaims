import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  ro: {
    translation: ro,
  },
  en: {
    translation: en,
  },
};

// Get the device locale
const deviceLocale = Localization.getLocales()?.[0]?.languageCode || 'en';
const supportedLanguage = ['en', 'ro'].includes(deviceLocale) ? deviceLocale : 'en';

console.log('Device locale:', deviceLocale, 'Using:', supportedLanguage);

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  nsSeparator: false,
  keySeparator: '.',
  resources,
  lng: supportedLanguage,
  fallbackLng: 'en',
  debug: __DEV__,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;