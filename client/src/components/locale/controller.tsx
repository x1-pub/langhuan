import React, { useContext, useEffect, useState } from 'react';
import { Popover } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { TranslationOutlined } from '@ant-design/icons';

import i18n, { normalizeLanguage, type TLanguage } from '@/i18n';
import { setPersistedLanguage } from '@/infra/storage/persistence';
import { LOCALE_OPTIONS, LocaleContext } from './constants';
import styles from './index.module.less';

const getLanguageByDayjsLocale = (language: TLanguage): string => {
  const option = LOCALE_OPTIONS.find(item => item.language === language);
  return option?.dayjsLocale || 'en';
};

const LocaleSwitcher: React.FC = () => {
  const { i18n: i18next } = useTranslation();
  const { setLocale } = useContext(LocaleContext);
  const activeLanguage = normalizeLanguage(i18next.resolvedLanguage) || 'en';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dayjs.locale(getLanguageByDayjsLocale(activeLanguage));
  }, [activeLanguage]);

  const changeLocale = async (language: TLanguage) => {
    const option = LOCALE_OPTIONS.find(item => item.language === language);
    if (!option) {
      return;
    }

    if (language === activeLanguage) {
      setOpen(false);
      return;
    }

    setLocale(option.antdLocale);
    setPersistedLanguage(language);
    dayjs.locale(option.dayjsLocale);
    await i18n.changeLanguage(language);
    setOpen(false);
  };

  const content = (
    <div className={styles.list}>
      {LOCALE_OPTIONS.map(option => (
        <button
          key={option.language}
          type="button"
          aria-pressed={activeLanguage === option.language}
          className={`${styles.item} ${activeLanguage === option.language ? styles.active : ''}`}
          onClick={() => changeLocale(option.language)}
        >
          {option.nativeName}
        </button>
      ))}
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
      <TranslationOutlined className={styles.icon} />
    </Popover>
  );
};

export default LocaleSwitcher;
