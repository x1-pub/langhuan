import React from 'react';
import { useQuery } from '@tanstack/react-query';

import useDatabaseWindows from '@/hooks/use-database-windows';
import { useThemeMode } from 'antd-style';
import CodeEditor from '@/components/code-editor';
import styles from './index.module.less';
import { trpc } from '@/utils/trpc';

const TableDDL: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const { connectionId, dbName, tableName } = useDatabaseWindows();

  const getTableDDLQuery = useQuery(
    trpc.mysql.getTableDDL.queryOptions({ connectionId, dbName, tableName }),
  );

  return (
    <div className={styles.tableDdl}>
      <CodeEditor
        value={getTableDDLQuery.data}
        theme={isDarkMode ? 'vs-dark' : 'vs'}
        readOnly={true}
        language="sql"
      />
    </div>
  );
};

export default TableDDL;
