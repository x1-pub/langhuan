import React from 'react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

import ViewerTabs from '@/components/table-tabs';
import TableData from './components/table-data';
import TableDesign from './components/table-design';
import TableDDL from './components/table-ddl';
import TableSatus from './components/table-status';
import styles from './index.module.less';

const MysqlViewer: React.FC = () => {
  const { t } = useTranslation();
  const tabsItem = [
    {
      label: t('mysql.data'),
      key: 'table-data',
      children: <TableData />,
    },
    {
      label: t('mysql.design'),
      key: 'table-design',
      children: <TableDesign />,
    },
    {
      label: t('mysql.ddl'),
      key: 'table-ddl',
      children: <TableDDL />,
    },
    {
      label: t('mysql.status'),
      key: 'table-status',
      children: <TableSatus />,
    },
  ];

  return (
    <ViewerTabs>
      <div className={styles.mysqlWrap}>
        <Tabs className={styles.mysqlTabs} items={tabsItem} tabPosition="left" />
      </div>
    </ViewerTabs>
  );
};

export default MysqlViewer;
