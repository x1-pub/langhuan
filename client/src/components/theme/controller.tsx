import React, { useEffect } from 'react';
import { Popover } from 'antd';
import { ThemeMode, useThemeMode } from 'antd-style';
import { useTranslation } from 'react-i18next';
import { SunOutlined } from '@ant-design/icons';

import storage, { THTME_KEY } from '@/utils/storage';
import { Theme } from './constants';
import styles from './index.module.less';

const ThemeController: React.FC = () => {
  const { isDarkMode, setThemeMode } = useThemeMode();
  const { t } = useTranslation();

  const handleThemeChange = (v: ThemeMode) => {
    setThemeMode(v);
    storage.set(THTME_KEY, v);
  };

  const initTheme = () => {
    const theme = storage.get(THTME_KEY);
    if (Object.values(Theme).includes(theme as Theme)) {
      setThemeMode(theme as ThemeMode);
      return;
    }
    storage.set(THTME_KEY, Theme.AUTO);
    setThemeMode(Theme.AUTO);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    changeScrollBarColor(isDarkMode);
  }, [isDarkMode]);

  const content = (
    <div className={styles.list}>
      <span onClick={() => handleThemeChange(Theme.AUTO)}>{t('themeAuto')}</span>
      <span onClick={() => handleThemeChange(Theme.LIGHT)}>{t('themeLight')}</span>
      <span onClick={() => handleThemeChange(Theme.DARK)}>{t('themeDark')}</span>
    </div>
  );

  return (
    <>
      <Popover content={content}>
        <SunOutlined className={styles.icon} />
      </Popover>
    </>
  );
};

export default ThemeController;
