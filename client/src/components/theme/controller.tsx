import React, { useEffect, useState } from 'react';
import { Popover } from 'antd';
import { ThemeMode, useThemeMode } from 'antd-style';
import { useTranslation } from 'react-i18next';
import { SunOutlined } from '@ant-design/icons';

import { getPersistedTheme, setPersistedTheme } from '@/utils/storage';
import { Theme } from './constants';
import styles from './index.module.less';

const THEME_STYLE_SELECTOR = 'head style[data-scrollbar="true"]';
const THEME_CSS_TOKENS = {
  dark: {
    '--theme-scrollbar-color': '#8D8D8D',
    '--theme-background-color': '#1F1F1F',
    '--theme-text-color': 'rgba(255,255,255,0.85)',
    '--theme-border-color': '#363636',
    '--theme-table-row-hover-bg': 'rgba(255,255,255,0.08)',
  },
  light: {
    '--theme-scrollbar-color': '#7F7F7F',
    '--theme-background-color': '#FFFFFF',
    '--theme-text-color': '#222222',
    '--theme-border-color': '#E7E7E7',
    '--theme-table-row-hover-bg': '#F5F5F5',
  },
} as const;

const createThemeCssText = (isDarkTheme: boolean) => {
  const cssTokens = isDarkTheme ? THEME_CSS_TOKENS.dark : THEME_CSS_TOKENS.light;
  const entries = Object.entries(cssTokens)
    .map(([token, value]) => `  ${token}: ${value};`)
    .join('\n');
  return `html {\n${entries}\n}`;
};

const ThemeToggle: React.FC = () => {
  const { isDarkMode, setThemeMode } = useThemeMode();
  const { t } = useTranslation();
  const [activeTheme, setActiveTheme] = useState<Theme>(Theme.AUTO);
  const [open, setOpen] = useState(false);

  const handleThemeChange = (v: ThemeMode) => {
    if (v === activeTheme) {
      setOpen(false);
      return;
    }
    setThemeMode(v);
    setPersistedTheme(v);
    setActiveTheme(v as Theme);
    setOpen(false);
  };

  const initTheme = () => {
    const theme = getPersistedTheme();
    if (Object.values(Theme).includes(theme as Theme)) {
      setThemeMode(theme as ThemeMode);
      setActiveTheme(theme as Theme);
      return;
    }
    setPersistedTheme(Theme.AUTO);
    setThemeMode(Theme.AUTO);
    setActiveTheme(Theme.AUTO);
  };

  const applyThemeCssVariables = (isDarkTheme: boolean) => {
    const cssText = createThemeCssText(isDarkTheme);
    const existingStyle = document.querySelector<HTMLStyleElement>(THEME_STYLE_SELECTOR);
    if (existingStyle) {
      existingStyle.textContent = cssText;
      return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-scrollbar', 'true');
    style.textContent = cssText;
    document.head.append(style);
  };

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    applyThemeCssVariables(isDarkMode);
  }, [isDarkMode]);

  const content = (
    <div className={styles.list}>
      <button
        type="button"
        aria-pressed={activeTheme === Theme.AUTO}
        className={`${styles.item} ${activeTheme === Theme.AUTO ? styles.active : ''}`}
        onClick={() => handleThemeChange(Theme.AUTO)}
      >
        {t('themeAuto')}
      </button>
      <button
        type="button"
        aria-pressed={activeTheme === Theme.LIGHT}
        className={`${styles.item} ${activeTheme === Theme.LIGHT ? styles.active : ''}`}
        onClick={() => handleThemeChange(Theme.LIGHT)}
      >
        {t('themeLight')}
      </button>
      <button
        type="button"
        aria-pressed={activeTheme === Theme.DARK}
        className={`${styles.item} ${activeTheme === Theme.DARK ? styles.active : ''}`}
        onClick={() => handleThemeChange(Theme.DARK)}
      >
        {t('themeDark')}
      </button>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
    >
      <SunOutlined className={styles.icon} />
    </Popover>
  );
};

export default ThemeToggle;
