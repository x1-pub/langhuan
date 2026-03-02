import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getPersistedLanguage } from '@/infra/storage/persistence';
import en from './en';
import ja from './ja';
import ko from './ko';
import zh from './zh';

export const SUPPORTED_LANGUAGES = ['en', 'zh', 'ja', 'ko'] as const;
export type TLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const normalizeLanguage = (value?: unknown): TLanguage | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const code = value.trim().toLowerCase().replace(/_/g, '-');
  if (!code) {
    return undefined;
  }

  if (code.startsWith('zh')) {
    return 'zh';
  }
  if (code.startsWith('ja')) {
    return 'ja';
  }
  if (code.startsWith('ko')) {
    return 'ko';
  }
  if (code.startsWith('en')) {
    return 'en';
  }

  return undefined;
};

const detectBrowserLanguage = (): TLanguage | undefined => {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  const candidates = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const language = normalizeLanguage(candidate);
    if (language) {
      return language;
    }
  }

  return undefined;
};

const detectInitialLanguage = (): TLanguage => {
  const storageLang = normalizeLanguage(getPersistedLanguage());
  if (storageLang) {
    return storageLang;
  }

  const browserLang = detectBrowserLanguage();
  if (browserLang) {
    return browserLang;
  }

  return 'en';
};

export const initialLanguage = detectInitialLanguage();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    debug: false,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
      ja: {
        translation: ja,
      },
      ko: {
        translation: ko,
      },
    },
  });
}

export default i18n;
