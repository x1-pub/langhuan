import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import storage, { LANG_KEY } from '@/utils/storage';
import en from './en';
import zh from './zh';

const zhLang = ['zh-cn', 'zh', 'zh-CN', 'zh-HK', 'zh-TW'];
const storageLang = storage.get(LANG_KEY);

export const isChinese =
  zhLang.includes(navigator.language) && (!storageLang || zhLang.includes(storageLang));

i18n.use(initReactI18next).init({
  debug: false,
  lng: isChinese ? 'zh' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: { ...en },
    },
    zh: {
      translation: { ...zh },
    },
  },
});

export default i18n;
