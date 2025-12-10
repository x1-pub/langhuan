import { createContext } from 'react';
import { ConfigProviderProps } from 'antd';

export type Locale = ConfigProviderProps['locale'];

interface IThemeValue {
  locale: Locale;
  setLocal: (locale: Locale) => void;
}

const defaultThemeValue = {
  locale: undefined,
  setLocal: () => {},
};

export const LocaleContext = createContext<IThemeValue>(defaultThemeValue);
