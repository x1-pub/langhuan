import React from 'react';
import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/hooks/use-database-windows';
import { trpc } from '@/utils/trpc';

const TableStatus: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const getTableStatusQuery = useQuery(
    trpc.mysql.getTableStatus.queryOptions({ connectionId, dbName, tableName }),
  );

  const items: DescriptionsProps['items'] = [
    { label: t('mysql.tableStatusDatabaseName'), children: dbName },
    { label: t('mysql.tableStatusTableName'), children: tableName },
    {
      label: t('mysql.tableStatusEstimatedRows'),
      children: getTableStatusQuery.data?.['TABLE_ROWS'] ?? '-',
    },
    {
      label: t('mysql.tableStatusDataLength'),
      children: getTableStatusQuery.data?.['DATA_LENGTH'] ?? '-',
    },
    { label: t('mysql.tableStatusEngine'), children: getTableStatusQuery.data?.['ENGINE'] ?? '-' },
    {
      label: t('mysql.tableStatusCreateTime'),
      children: getTableStatusQuery.data?.['CREATE_TIME'] ?? '-',
    },
    {
      label: t('mysql.tableStatusUpdateTime'),
      children: getTableStatusQuery.data?.['UPDATE_TIME'] ?? '-',
    },
    {
      label: t('mysql.tableStatusCollation'),
      children: getTableStatusQuery.data?.['TABLE_COLLATION'] ?? '-',
    },
    {
      label: t('mysql.tableStatusRowFormat'),
      children: getTableStatusQuery.data?.['ROW_FORMAT'] ?? '-',
    },
    {
      label: t('mysql.tableStatusAvgRowLength'),
      children: getTableStatusQuery.data?.['AVG_ROW_LENGTH'] ?? '-',
    },
    {
      label: t('mysql.tableStatusMaxDataLength'),
      children: getTableStatusQuery.data?.['MAX_DATA_LENGTH'] ?? '-',
    },
    {
      label: t('mysql.tableStatusIndexLength'),
      children: getTableStatusQuery.data?.['INDEX_LENGTH'] ?? '-',
    },
    {
      label: t('mysql.tableStatusAutoIncrement'),
      children: getTableStatusQuery.data?.['AUTO_INCREMENT'] ?? '-',
    },
    {
      label: t('mysql.tableStatusComment'),
      children: getTableStatusQuery.data?.['TABLE_COMMENT'] ?? '-',
    },
  ];

  return (
    <Descriptions column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 3 }} bordered items={items} />
  );
};

export default TableStatus;
