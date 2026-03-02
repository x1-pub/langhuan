import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import IndexManager from './components/index-manager';
import ColumnsManager from './components/columns-manager';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { trpc } from '@/utils/trpc';
import styles from './index.module.less';

type TDesignTab = 'table-field' | 'table-index';

const TableDesign: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [activeDesignTab, setActiveDesignTab] = useState<TDesignTab>('table-field');

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
    <div className={styles.designPanel}>
      <Tabs
        activeKey={activeDesignTab}
        className={styles.designTabs}
        onChange={key => setActiveDesignTab(key as TDesignTab)}
        items={[
          {
            key: 'table-field',
            label: t('table.field'),
            children: (
              <ColumnsManager
                data={getTableColumnsQuery.data || []}
                index={getTableIndexQuery.data || []}
                onOk={refresh}
              />
            ),
          },
          {
            key: 'table-index',
            label: t('table.index'),
            children: (
              <IndexManager
                data={getTableIndexQuery.data || []}
                columns={getTableColumnsQuery.data || []}
                onOk={refresh}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default TableDesign;
