import React from 'react';
import { Space } from 'antd';
import { useQuery } from '@tanstack/react-query';

import IndexManager from './components/index-manager';
import ColumnsManager from './components/columns-manager';
import TablePartition from './components/partition';
import TableTrigger from './components/table-trigger';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { trpc } from '@/utils/trpc';

const TableDesign: React.FC = () => {
  const { connectionId, dbName, tableName } = useDatabaseWindows();

  const getTableIndexQuery = useQuery(
    trpc.mysql.getTableIndex.queryOptions({ connectionId, dbName, tableName }),
  );
  const getTableColumnsQuery = useQuery(
    trpc.mysql.getTableColumns.queryOptions({ connectionId, dbName, tableName }),
  );

  const refresh = () => {
    getTableIndexQuery.refetch();
    getTableColumnsQuery.refetch();
  };

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <IndexManager
          data={getTableIndexQuery.data || []}
          columns={getTableColumnsQuery.data || []}
          onOk={refresh}
        />
        <ColumnsManager
          data={getTableColumnsQuery.data || []}
          index={getTableIndexQuery.data || []}
          onOk={refresh}
        />
        <TablePartition />
        <TableTrigger />
      </Space>
    </div>
  );
};

export default TableDesign;
