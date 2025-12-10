import React from 'react';
import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';

import useMain from '@/utils/use-main';
import { trpc } from '@/utils/trpc';

const TableSatus: React.FC = () => {
  const { connectionId, dbName, tableName } = useMain();
  const getTableStatusQuery = useQuery(
    trpc.mysql.getTableStatus.queryOptions({ connectionId, dbName, tableName }),
  );

  const items: DescriptionsProps['items'] = [
    { label: '数据库名称', children: dbName },
    { label: '表名称', children: tableName },
    { label: '行数(估值)', children: getTableStatusQuery.data?.['TABLE_ROWS'] ?? '-' },
    { label: '数据长度', children: getTableStatusQuery.data?.['DATA_LENGTH'] ?? '-' },
    { label: '引擎', children: getTableStatusQuery.data?.['ENGINE'] ?? '-' },
    { label: '创建日期', children: getTableStatusQuery.data?.['CREATE_TIME'] ?? '-' },
    { label: '修改日期', children: getTableStatusQuery.data?.['UPDATE_TIME'] ?? '-' },
    { label: '排序规则', children: getTableStatusQuery.data?.['TABLE_COLLATION'] ?? '-' },
    { label: '行格式', children: getTableStatusQuery.data?.['ROW_FORMAT'] ?? '-' },
    { label: '平均行长度', children: getTableStatusQuery.data?.['AVG_ROW_LENGTH'] ?? '-' },
    { label: '最大数据长度', children: getTableStatusQuery.data?.['MAX_DATA_LENGTH'] ?? '-' },
    { label: '索引长度', children: getTableStatusQuery.data?.['INDEX_LENGTH'] ?? '-' },
    { label: '自动递增', children: getTableStatusQuery.data?.['AUTO_INCREMENT'] ?? '-' },
    { label: '表注释', children: getTableStatusQuery.data?.['TABLE_COMMENT'] ?? '-' },
  ];

  return (
    <Descriptions column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 3 }} bordered items={items} />
  );
};

export default TableSatus;
