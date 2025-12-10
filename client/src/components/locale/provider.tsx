import React, { useState, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

import { isChinese } from '@/i18n';
import { LocaleContext, type Locale } from './constants';

const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocal] = useState<Locale>(isChinese ? zhCN : enUS);

  return (
    <LocaleContext.Provider value={{ locale: locale!, setLocal }}>
      <ConfigProvider locale={locale}>{children}</ConfigProvider>
    </LocaleContext.Provider>
  );
};

export default LocaleProvider;
