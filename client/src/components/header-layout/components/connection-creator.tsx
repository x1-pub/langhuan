import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { AppstoreAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import ConnectionModal from './connection-modal';
import styles from './index.module.less';

interface DBCreatorProps {
  onOk?: () => void;
}

const DBCreator: React.FC<DBCreatorProps> = ({ onOk }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);

  const handleOk = () => {
    onOk?.();
    setOpen(false);
  };

  return (
    <>
      <Tooltip placement="bottom" title={t('connection.create')}>
        <AppstoreAddOutlined className={styles.iconColor} onClick={() => setOpen(true)} />
      </Tooltip>
      <ConnectionModal open={open} onOk={handleOk} onCancel={() => setOpen(false)} />
    </>
  );
};

export default DBCreator;
