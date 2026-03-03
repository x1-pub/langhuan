import React, { Suspense } from 'react';
import { Empty, Spin } from 'antd';
import { useThemeMode } from 'antd-style';

import styles from './index.module.less';

const LazyCodeEditor = React.lazy(() => import('@/components/code-editor'));

interface TableDDLProps {
  loading: boolean;
  ddl?: string;
}

const TableDDL: React.FC<TableDDLProps> = ({ loading, ddl }) => {
  const { isDarkMode } = useThemeMode();

  if (loading) {
    return (
      <div className={styles.tableDdl}>
        <Spin className={styles.spin} />
      </div>
    );
  }

  if (!ddl) {
    return (
      <div className={styles.tableDdl}>
        <Empty className={styles.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className={styles.tableDdl}>
      <Suspense fallback={<Spin className={styles.spin} />}>
        <LazyCodeEditor
          value={ddl}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
          readOnly={true}
          language="sql"
        />
      </Suspense>
    </div>
  );
};

export default TableDDL;
