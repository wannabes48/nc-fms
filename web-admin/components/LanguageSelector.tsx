'use client';
import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as 'en' | 'sw';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'sw' : 'en';
    setLang(nextLang);
    localStorage.setItem('app_lang', nextLang);
    // Trigger a custom event or reload to update dictionary strings across the app
    window.location.reload();
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#E4E1D8] bg-white text-[#232420] text-xs font-medium hover:border-[#0F6E56] transition-colors"
      title="Switch Language / Badilisha Lugha"
    >
      <Globe className="w-3.5 h-3.5 text-[#0F6E56]" />
      <span>{lang === 'en' ? 'EN' : 'SW'}</span>
    </button>
  );
}
