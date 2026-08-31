'use client'; // Required for Next.js App router when using hooks

import React from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n'; // Initialize i18n

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'sw' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {t('switch_language')}
    </button>
  );
}