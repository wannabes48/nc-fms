import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sw from './locales/sw.json';

i18n
  .use(LanguageDetector) // Automatically detects and saves to localStorage
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      sw: sw,
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
  });

export default i18n;