import React, { useEffect, useState } from 'react';
import { Popover } from 'antd';
import { ThemeMode, useThemeMode } from 'antd-style';
import { useTranslation } from 'react-i18next';
import { SunOutlined } from '@ant-design/icons';

import storage, { THTME_KEY } from '@/utils/storage';
import { Theme } from './constants';
import styles from './index.module.less';

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
    storage.set(THTME_KEY, v);
    setActiveTheme(v as Theme);
    setOpen(false);
  };

  const initTheme = () => {
    const theme = storage.get(THTME_KEY);
    if (Object.values(Theme).includes(theme as Theme)) {
      setThemeMode(theme as ThemeMode);
      setActiveTheme(theme as Theme);
      return;
    }
    storage.set(THTME_KEY, Theme.AUTO);
    setThemeMode(Theme.AUTO);
    setActiveTheme(Theme.AUTO);
  };

  const changeScrollBarColor = (dark: boolean) => {
    const style = document.createElement('style');
    style.setAttribute('data-scrollbar', 'true');
    style.innerHTML = `
      html {
        --theme-scrollbar-color: ${dark ? '#8D8D8D' : '7F7F7F'};
        --theme-background-color: ${dark ? '#1F1F1F' : '#FFFFFF'};
        --theme-text-color: ${dark ? 'rgba(255,255,255,0.85)' : '#222222'};
        --theme-border-color: ${dark ? '#363636' : '#E7E7E7'};
      }
    `;
    document.querySelector('head style[data-scrollbar="true"]')?.remove();
    document.querySelector('head')?.append(style);
  };

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    changeScrollBarColor(isDarkMode);
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
