import React from 'react';
import { Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import {
  AggregationsPanel,
  DocumentsPanel,
  IndexesPanel,
  SchemaPanel,
  StatsPanel,
  ValidationPanel,
} from '../panels';
import { DocumentEditorModal, IndexEditorModal } from '../modals';
import { TActiveTab } from '../shared';
import useMongoViewerModel from './use-mongodb-viewer-model';
import styles from '../../index.module.less';

const Viewer: React.FC = () => {
  const { t } = useTranslation();
  const {
    validTableName,
    activeTab,
    setActiveTab,
    documentsPanelProps,
    aggregationsPanelProps,
    indexesPanelProps,
    validationPanelProps,
    schemaPanelProps,
    statsPanelProps,
    documentEditorModalProps,
    indexEditorModalProps,
  } = useMongoViewerModel();

  if (!validTableName) {
    return (
      <div className={styles.empty}>
        <Typography.Text strong={true}>{t('connection.notSelected')}</Typography.Text>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as TActiveTab)}
        className={styles.tabs}
        items={[
          {
            key: 'documents',
            label: t('mongodb.documents'),
            children: <DocumentsPanel {...documentsPanelProps} />,
          },
          {
            key: 'aggregations',
            label: t('mongodb.aggregations'),
            children: <AggregationsPanel {...aggregationsPanelProps} />,
          },
          {
            key: 'indexes',
            label: t('mongodb.indexes'),
            children: <IndexesPanel {...indexesPanelProps} />,
          },
          {
            key: 'validation',
            label: t('mongodb.validation'),
            children: <ValidationPanel {...validationPanelProps} />,
          },
          {
            key: 'schema',
            label: t('mongodb.schema'),
            children: <SchemaPanel {...schemaPanelProps} />,
          },
          {
            key: 'stats',
            label: t('mongodb.stats'),
            children: <StatsPanel {...statsPanelProps} />,
          },
        ]}
      />

      <DocumentEditorModal {...documentEditorModalProps} />
      <IndexEditorModal {...indexEditorModalProps} />
    </div>
  );
};

export default Viewer;
