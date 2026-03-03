import React from 'react';
import { Card, Descriptions, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import { formatBytes, formatMongoValue, isPlainObject, TMongoStats } from '../shared';
import styles from '../../index.module.less';

interface StatsPanelProps {
  statsData: TMongoStats & {
    [key: string]: unknown;
    storageSize?: number;
    totalIndexSize?: number;
    count?: number;
    estimatedCount?: number;
  };
  isLoading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ statsData, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.panelBody}>
      <div className={styles.statsContent}>
        <Spin spinning={isLoading} className={styles.statsSpin}>
          <div className={styles.statsBody}>
            <div className={styles.statsGrid}>
              <Card size="small" title={t('mongodb.count')}>
                <Typography.Text strong={true}>{String(statsData?.count ?? '-')}</Typography.Text>
              </Card>
              <Card size="small" title={t('mongodb.estimatedCount')}>
                <Typography.Text strong={true}>
                  {String(statsData?.estimatedCount ?? '-')}
                </Typography.Text>
              </Card>
              <Card size="small" title={t('mongodb.storageSize')}>
                <Typography.Text strong={true}>
                  {formatBytes(statsData?.storageSize)}
                </Typography.Text>
              </Card>
              <Card size="small" title={t('mongodb.totalIndexSize')}>
                <Typography.Text strong={true}>
                  {formatBytes(statsData?.totalIndexSize)}
                </Typography.Text>
              </Card>
            </div>

            <Descriptions
              bordered={true}
              size="small"
              column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 2 }}
              styles={{
                label: { width: 180, whiteSpace: 'nowrap' },
                content: { minWidth: 260 },
              }}
              className={styles.statsDetail}
              items={Object.entries(statsData || {}).map(([key, value]) => ({
                key,
                label: key,
                children:
                  isPlainObject(value) || Array.isArray(value)
                    ? formatMongoValue(value)
                    : String(value),
              }))}
            />
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default StatsPanel;
