import React from 'react';
import { KeyOutlined } from '@ant-design/icons';

import styles from './index.module.less';

interface PrimaryIconProps {
  seg: number;
}

const PrimaryIcon: React.FC<PrimaryIconProps> = ({ seg }) => {
  return (
    <span className={styles.primaryIcon}>
      <KeyOutlined className={styles.icone} />
      <span className={styles.seg}>{seg}</span>
    </span>
  );
};

export default PrimaryIcon;
