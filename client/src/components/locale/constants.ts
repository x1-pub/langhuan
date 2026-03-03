import { createContext, type Dispatch, type SetStateAction } from 'react';
import { ConfigProviderProps } from 'antd';
import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import koKR from 'antd/locale/ko_KR';
import zhCN from 'antd/locale/zh_CN';

import type { TLanguage } from '@/i18n';

export type Locale = NonNullable<ConfigProviderProps['locale']>;

interface ILocaleContextValue {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}

export interface LocaleOption {
  language: TLanguage;
  nativeName: string;
  antdLocale: Locale;
  dayjsLocale: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  {
    language: 'en',
    nativeName: 'English',
    antdLocale: enUS,
    dayjsLocale: 'en',
  },
  {
    language: 'zh',
    nativeName: '简体中文',
    antdLocale: zhCN,
    dayjsLocale: 'zh-cn',
  },
  {
    language: 'ja',
    nativeName: '日本語',
    antdLocale: jaJP,
    dayjsLocale: 'ja',
  },
  {
    language: 'ko',
    nativeName: '한국어',
    antdLocale: koKR,
    dayjsLocale: 'ko',
  },
];

export const DEFAULT_LOCALE = LOCALE_OPTIONS[0].antdLocale;

const defaultLocaleContextValue: ILocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
};

export const LocaleContext = createContext<ILocaleContextValue>(defaultLocaleContextValue);
