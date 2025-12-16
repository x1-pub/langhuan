import React, { useContext } from 'react';
import { Popover } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { TranslationOutlined } from '@ant-design/icons';

import { isChinese } from '@/i18n';
import storage, { LANG_KEY } from '@/utils/storage';
import { Locale, LocaleContext } from './constants';
import styles from './index.module.less';

dayjs.locale(isChinese ? 'zh-cn' : 'en');

const LocaleSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { setLocal } = useContext(LocaleContext);

  const changeLocale = (localeValue: Locale) => {
    if (!localeValue) {
      localeValue = enUS;
    }

    setLocal(localeValue);
    storage.set(LANG_KEY, localeValue.locale);

    if (localeValue.locale === 'en') {
      dayjs.locale('en');
      i18n.changeLanguage('en');
    } else {
      dayjs.locale('zh-cn');
      i18n.changeLanguage('zh');
    }
  };

  const content = (
    <div className={styles.list}>
      <span onClick={() => changeLocale(enUS)}>English</span>
      <span onClick={() => changeLocale(zhCN)}>简体中文</span>
    </div>
  );

  return (
    <Popover content={content}>
      <TranslationOutlined className={styles.icon} />
    </Popover>
  );
};

export default LocaleSwitcher;
