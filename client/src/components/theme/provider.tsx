import { ReactNode } from 'react';
import { ThemeProvider as ThemeCtx, ThemeMode } from 'antd-style';

import storage, { THTME_KEY } from '@/utils/storage';
import { Theme } from './constants';

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  let defaultTheme = storage.get(THTME_KEY) || Theme.DARK;
  if (!Object.values(Theme).includes(defaultTheme as Theme)) {
    defaultTheme = Theme.DARK;
  }

  return <ThemeCtx defaultThemeMode={defaultTheme as ThemeMode}>{children}</ThemeCtx>;
};

export default ThemeProvider;
