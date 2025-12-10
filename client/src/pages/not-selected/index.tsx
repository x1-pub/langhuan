import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from './index.module.less';

const NotSelected = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap}>
      <Typography.Text style={{ fontSize: '22px' }} strong={true}>
        {t('connection.notSelected')}
      </Typography.Text>
    </div>
  );
};

export default NotSelected;
