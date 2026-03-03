import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';

import i18n, { normalizeLanguage } from '@/i18n';
import { DEFAULT_LOCALE, LOCALE_OPTIONS, LocaleContext, type Locale } from './constants';

const resolveAntdLocale = (language?: string): Locale => {
  const normalizedLanguage = normalizeLanguage(language);
  return (
    LOCALE_OPTIONS.find(option => option.language === (normalizedLanguage || 'en'))?.antdLocale ||
    DEFAULT_LOCALE
  );
};

const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() =>
    resolveAntdLocale(i18n.resolvedLanguage || i18n.language),
  );

  useEffect(() => {
    const onLanguageChanged = (language: string) => {
      setLocale(resolveAntdLocale(language));
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const contextValue = useMemo(() => ({ locale, setLocale }), [locale]);

  return (
    <LocaleContext.Provider value={contextValue}>
      <ConfigProvider locale={locale}>{children}</ConfigProvider>
    </LocaleContext.Provider>
  );
};

export default LocaleProvider;
