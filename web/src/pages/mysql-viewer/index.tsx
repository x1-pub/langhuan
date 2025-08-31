import React from "react";
import { Tabs } from 'antd';

import ViewerTabs from "@/components/viewer-tabs";
import TableData from "./components/table-data";
import TableDesign from "./components/table-design";
import TableDDL from "./components/table-ddl";
import TableSatus from "./components/table-status";
import TableTrigger from "./components/table-trigger";
import styles from './index.module.less'
import { useTranslation } from "react-i18next";

const MysqlViewer: React.FC = () => {
  const { t } = useTranslation()
  const tabsItem = [
    {
      label: t('mysqlTab.data'),
      key: 'table-data',
      children: <TableData />
    },
    {
      label: t('mysqlTab.design'),
      key: 'table-design',
      children: <TableDesign />
    },
    {
      label: t('mysqlTab.ddl'),
      key: 'table-ddl',
      children: <TableDDL />
    },
    {
      label: t('mysqlTab.trigger'),
      key: 'table-trigger',
      children: <TableTrigger />
    },
    {
      label: t('mysqlTab.status'),
      key: 'table-status',
      children: <TableSatus />
    },
  ]

  return <ViewerTabs>
    <div className={styles.mysqlWrap}>
      <Tabs className={styles.mysqlTabs} items={tabsItem} tabPosition='left' />
    </div>
  </ViewerTabs>
}

export default MysqlViewer