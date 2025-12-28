import React, { Suspense } from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';

import useDatabaseWindows from '@/hooks/use-database-windows';
import { useThemeMode } from 'antd-style';
import styles from './index.module.less';
import { trpc } from '@/utils/trpc';

const LazyCodeEditor = React.lazy(() => import('@/components/code-editor'));

const TableDDL: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const { connectionId, dbName, tableName } = useDatabaseWindows();

  const getTableDDLQuery = useQuery(
    trpc.mysql.getTableDDL.queryOptions({ connectionId, dbName, tableName }),
  );

  return (
    <div className={styles.tableDdl}>
      <Suspense fallback={<Spin className={styles.spin} />}>
        <LazyCodeEditor
          value={getTableDDLQuery.data}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
          readOnly={true}
          language="sql"
        />
      </Suspense>
    </div>
  );
};

export default TableDDL;
