import React from 'react';
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Space,
  Switch,
  Table,
  Typography,
  type TableProps,
} from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { DEFAULT_PIPELINE, IAggregationTableRow, TAggregationViewMode } from '../shared';
import styles from '../../index.module.less';

interface AggregationsPanelProps {
  pipelineText: string;
  setPipelineText: (value: string) => void;
  allowDiskUse: boolean;
  setAllowDiskUse: (value: boolean) => void;
  maxTimeMS?: number;
  setMaxTimeMS: (value?: number) => void;
  onRunAggregation: () => void;
  onExplainAggregation: () => void;
  explainOpen: boolean;
  explainResult: string;
  onCloseExplain: () => void;
  isRunning: boolean;
  isExplaining: boolean;
  aggViewMode: TAggregationViewMode;
  setAggViewMode: (value: TAggregationViewMode) => void;
  aggregationRows: IAggregationTableRow[];
  aggregationColumns: TableProps<IAggregationTableRow>['columns'];
}

const AggregationsPanel: React.FC<AggregationsPanelProps> = ({
  pipelineText,
  setPipelineText,
  allowDiskUse,
  setAllowDiskUse,
  maxTimeMS,
  setMaxTimeMS,
  onRunAggregation,
  onExplainAggregation,
  explainOpen,
  explainResult,
  onCloseExplain,
  isRunning,
  isExplaining,
  aggViewMode,
  setAggViewMode,
  aggregationRows,
  aggregationColumns,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.panelBody}>
      <div className={styles.aggregationEditor}>
        <Input.TextArea
          value={pipelineText}
          onChange={event => setPipelineText(event.target.value)}
          rows={6}
          className={styles.pipelineInput}
        />
        <div className={styles.aggregationActionRow}>
          <Space size={8} align="center" className={styles.aggregationOptionGroup}>
            <Typography.Text>{t('mongodb.allowDiskUse')}</Typography.Text>
            <Switch checked={allowDiskUse} onChange={setAllowDiskUse} />
          </Space>
          <Space size={8} align="center" className={styles.aggregationOptionGroup}>
            <Typography.Text>{t('mongodb.maxTimeMS')}</Typography.Text>
            <InputNumber
              min={1}
              max={600000}
              value={maxTimeMS}
              addonAfter="ms"
              className={styles.aggregationMaxTimeInput}
              onChange={value =>
                setMaxTimeMS(value === null ? undefined : Math.max(1, Number(value || 1)))
              }
            />
          </Space>
          <Space className={styles.aggregationButtonGroup}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={isRunning}
              onClick={onRunAggregation}
            >
              {t('mongodb.runPipeline')}
            </Button>
            <Button loading={isExplaining} onClick={onExplainAggregation}>
              {t('mongodb.explainPipeline')}
            </Button>
            <Button
              onClick={() => {
                setPipelineText(DEFAULT_PIPELINE);
                setAllowDiskUse(false);
                setMaxTimeMS(30000);
              }}
            >
              {t('button.reset')}
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.infoBar}>
        <Typography.Text>
          {t('mongodb.aggregationResult', { total: aggregationRows.length })}
        </Typography.Text>
        <Segmented<TAggregationViewMode>
          value={aggViewMode}
          onChange={setAggViewMode}
          options={[
            { label: t('mongodb.tableView'), value: 'table' },
            { label: t('mongodb.jsonView'), value: 'json' },
          ]}
        />
      </div>

      <div className={styles.aggregationContent}>
        {aggViewMode === 'table' ? (
          <Table<IAggregationTableRow>
            rowKey="__mongo_row_key"
            columns={aggregationColumns}
            dataSource={aggregationRows}
            loading={isRunning}
            pagination={false}
            className={styles.dataTable}
            scroll={{ x: 'max-content', y: 'calc(100vh - 375px)' }}
          />
        ) : (
          <div className={styles.jsonCards}>
            {aggregationRows.map(row => {
              const { __mongo_row_key: rowKey, ...doc } = row;
              return (
                <Card key={rowKey} size="small" className={styles.jsonCard}>
                  <pre className={styles.jsonCode}>{JSON.stringify(doc, null, 2)}</pre>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={explainOpen}
        title={t('mongodb.executionPlan')}
        width={900}
        footer={null}
        onCancel={onCloseExplain}
        destroyOnHidden={true}
      >
        <pre className={styles.explainCode}>{explainResult}</pre>
      </Modal>
    </div>
  );
};

export default AggregationsPanel;
