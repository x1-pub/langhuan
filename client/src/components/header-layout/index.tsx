import React, { useRef } from 'react';
import { GithubOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { ThemeController } from '@/components/theme';
import { LocaleController } from '@/components/locale';
import ConnectionSelector, { RefHandler } from './components/connection-selector';
import ConnectionCreator from './components/connection-creator';
import LogoImg from '@/assets/image/logo.png';
import styles from './index.module.less';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const HeaderLayout: React.FC = () => {
  const { t } = useTranslation();
  const selectorRef = useRef<RefHandler>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isWelcomePage = location.pathname === '/';

  const linkToGithub = () => {
    window.open('https://github.com/CleverLiurx/langhuange');
  };

  const handleAfterCreate = () => {
    selectorRef.current?.refreshList();
  };

  const navToWelcome = () => {
    navigate('/');
  };

  return (
    <>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <div className={styles.left}>
            <div className={styles.logoWrap} onClick={navToWelcome}>
              <img className={styles.logo} src={LogoImg} alt="" />
              <Typography.Text className={styles.title}>{t('siteName')}</Typography.Text>
            </div>
            {!isWelcomePage && (
              <div className={styles.db}>
                <ConnectionSelector ref={selectorRef} />
                <ConnectionCreator onOk={handleAfterCreate} />
              </div>
            )}
          </div>
          <div className={styles.right}>
            <ThemeController />
            <LocaleController />
            <GithubOutlined className={styles.github} onClick={linkToGithub} />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};

export default HeaderLayout;
