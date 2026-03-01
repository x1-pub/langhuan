import React from 'react';
import { Descriptions, Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import { formatByteSize } from '@/utils/format-byte-size';

interface StatsPanelProps {
  loading: boolean;
  stats?: Record<string, unknown>;
}

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

const renderText = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
};

const StatsPanel: React.FC<StatsPanelProps> = ({ loading, stats }) => {
  const { t } = useTranslation();

  if (loading) {
    return <Spin spinning={true} />;
  }

  if (!stats) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Descriptions bordered={true} column={1}>
      <Descriptions.Item label={t('pgsql.exactRows')}>
        {toSafeNumber(stats.exactRows).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.estimatedRows')}>
        {toSafeNumber(stats.estimatedRows).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.tableSize')}>
        {formatByteSize(toSafeNumber(stats.tableSize))}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.indexesSize')}>
        {formatByteSize(toSafeNumber(stats.indexesSize))}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.totalSize')}>
        {formatByteSize(toSafeNumber(stats.totalSize))}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.liveTuples')}>
        {toSafeNumber(stats.liveTuples).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.deadTuples')}>
        {toSafeNumber(stats.deadTuples).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.insertedTuples')}>
        {toSafeNumber(stats.insertedTuples).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.updatedTuples')}>
        {toSafeNumber(stats.updatedTuples).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.deletedTuples')}>
        {toSafeNumber(stats.deletedTuples).toLocaleString()}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.lastVacuum')}>
        {renderText(stats.lastVacuum)}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.lastAutovacuum')}>
        {renderText(stats.lastAutovacuum)}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.lastAnalyze')}>
        {renderText(stats.lastAnalyze)}
      </Descriptions.Item>
      <Descriptions.Item label={t('pgsql.lastAutoanalyze')}>
        {renderText(stats.lastAutoanalyze)}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default StatsPanel;
