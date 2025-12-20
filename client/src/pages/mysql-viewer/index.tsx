import React from 'react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

import TableSwitcher from '@/components/table-switcher';
import TableData from './components/table-data';
import TableDesign from './components/table-design';
import TableDDL from './components/table-ddl';
import TableSatus from './components/table-status';
import styles from './index.module.less';
import { ESpecialWind, IWind } from '@/hooks/use-database-windows';
import MysqlEvent from './components/database-event';
import MysqlView from './components/database-view';
import MysqlFunction from './components/database-function';

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

  const renderWind = (wind: IWind) => {
    switch (wind.specialWind) {
      case ESpecialWind.MYSQL_ENENT:
        return <MysqlEvent />;
      case ESpecialWind.MYSQL_FUNCTION:
        return <MysqlFunction />;
      case ESpecialWind.MYSQL_VIEW:
        return <MysqlView />;
      default:
        return (
          <div className={styles.mysqlWrap}>
            <Tabs className={styles.mysqlTabs} items={tabsItem} tabPlacement="start" />
          </div>
        );
    }
  };

  return <TableSwitcher>{renderWind}</TableSwitcher>;
};

export default MysqlViewer;
