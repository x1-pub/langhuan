import React from 'react';
import { Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';
import DataPanel from './data-panel';
import TableDesignPanel from './table-design-panel';
import TableDDL from './table-ddl';
import StatsPanel from './stats-panel';
import RowEditorModal from './row-editor-modal';
import TriggersPanel from './triggers-panel';
import PartitionsPanel from './partitions-panel';
import usePgsqlViewerModel from '@/domain/pgsql/hooks/use-pgsql-viewer-model';
import type { PgsqlActiveTab } from '@/domain/pgsql/model/viewer';

const Viewer: React.FC = () => {
  const { t } = useTranslation();
  const {
    validTableName,
    activeTab,
    setActiveTab,
    dataPanelProps,
    tableDesignPanelProps,
    triggersPanelProps,
    partitionsPanelProps,
    tableDdlProps,
    statsPanelProps,
    rowEditorModalProps,
  } = usePgsqlViewerModel();

  if (!validTableName) {
    return (
      <div className={styles.empty}>
        <Typography.Text strong={true}>{t('pgsql.noTableSelected')}</Typography.Text>
      </div>
    );
  }

  return (
    <div className={styles.pgsqlWrap}>
      <Tabs
        activeKey={activeTab}
        tabPlacement="start"
        className={styles.pgsqlTabs}
        onChange={key => setActiveTab(key as PgsqlActiveTab)}
        items={[
          {
            key: 'table-data',
            label: t('mysql.data'),
            children: <DataPanel {...dataPanelProps} />,
          },
          {
            key: 'table-design',
            label: t('mysql.design'),
            children: <TableDesignPanel {...tableDesignPanelProps} />,
          },
          {
            key: 'table-triggers',
            label: t('mysql.trigger'),
            children: <TriggersPanel {...triggersPanelProps} />,
          },
          {
            key: 'table-partitions',
            label: t('mysql.partition'),
            children: <PartitionsPanel {...partitionsPanelProps} />,
          },
          {
            key: 'table-ddl',
            label: t('mysql.ddl'),
            children: <TableDDL {...tableDdlProps} />,
          },
          {
            key: 'table-stats',
            label: t('mysql.status'),
            children: <StatsPanel {...statsPanelProps} />,
          },
        ]}
      />

      <RowEditorModal {...rowEditorModalProps} />
    </div>
  );
};

export default Viewer;
