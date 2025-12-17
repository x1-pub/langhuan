import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import ShellIcon from '@/assets/svg/shell.svg?react';
import { EConnectionType } from '@packages/types/connection';
import styles from './index.module.less';

interface IActions {
  connectionId: number;
  connectionType: EConnectionType;
  onCreateDatabase?: () => void;
}

const Actions: React.FC<IActions> = ({ connectionId, connectionType, onCreateDatabase }) => {
  const { t } = useTranslation();

  const handleOpenShell = () => {
    window.open(`/${connectionType}/${connectionId}/shell`, '_blank');
  };

  return (
    <div className={styles.actions}>
      {connectionType !== EConnectionType.REDIS && (
        <Button type="dashed" shape="round" icon={<PlusOutlined />} onClick={onCreateDatabase}>
          {t('mysql.createDb')}
        </Button>
      )}
      <Button
        className={styles.shell}
        block={connectionType === EConnectionType.REDIS}
        type="dashed"
        shape="round"
        icon={<ShellIcon className={styles.icon} />}
        onClick={handleOpenShell}
      >
        Shell
      </Button>
    </div>
  );
};

export default Actions;
