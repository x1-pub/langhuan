import { Button, Result, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import styles from './index.module.less';

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomeLikeRoute = location.pathname === '/';

  return (
    <div className={styles.page}>
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={
          <Space>
            <Button type="default" onClick={() => navigate('/')}>
              {t('notFound.backHome')}
            </Button>
            {!isHomeLikeRoute && (
              <Button type="primary" onClick={() => navigate('/notselected')}>
                {t('notFound.backWorkspace')}
              </Button>
            )}
          </Space>
        }
      />
    </div>
  );
};

export default NotFound;
