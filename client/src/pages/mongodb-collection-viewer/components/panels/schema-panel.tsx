import React from 'react';
import { Button, Card, InputNumber, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import styles from '../../index.module.less';

interface SchemaField {
  path: string;
  count: number;
  coverage: number;
  required: boolean;
  types: Array<{
    type: string;
    count: number;
  }>;
  examples: string[];
}

interface SchemaPanelProps {
  sampleSize: number;
  onChangeSampleSize: (value: number) => void;
  isLoading: boolean;
  onAnalyze: () => void;
  onRefresh: () => void;
  schemaData?: {
    sampledCount: number;
    fieldCount: number;
    fields: SchemaField[];
  };
}

const SCHEMA_TABLE_SCROLL_Y = 'calc(100vh - 375px)';

const SchemaPanel: React.FC<SchemaPanelProps> = ({
  sampleSize,
  onChangeSampleSize,
  isLoading,
  onAnalyze,
  onRefresh,
  schemaData,
}) => {
  const { t } = useTranslation();
  const fields = schemaData?.fields || [];

  return (
    <div className={styles.panelBody}>
      <div className={styles.schemaControls}>
        <div className={styles.schemaSampleInline}>
          <span className={styles.queryLabel}>{t('mongodb.sampleSize')}</span>
          <InputNumber
            min={10}
            max={5000}
            value={sampleSize}
            className={styles.schemaSampleInput}
            onChange={value => onChangeSampleSize(Math.max(10, Number(value || 10)))}
          />
        </div>

        <Space className={styles.schemaControlActions}>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('button.refresh')}
          </Button>
          <Button type="primary" loading={isLoading} onClick={onAnalyze}>
            {t('mongodb.analyzeSchema')}
          </Button>
        </Space>
      </div>

      <div className={styles.schemaSummary}>
        <Card size="small" title={t('mongodb.sampledDocs')}>
          <Typography.Text strong={true}>{String(schemaData?.sampledCount || 0)}</Typography.Text>
        </Card>
        <Card size="small" title={t('mongodb.schemaFields')}>
          <Typography.Text strong={true}>{String(schemaData?.fieldCount || 0)}</Typography.Text>
        </Card>
        <Card size="small" title={t('mongodb.required')}>
          <Typography.Text strong={true}>
            {String(fields.filter(field => field.required).length)}
          </Typography.Text>
        </Card>
      </div>

      <div className={styles.schemaTableWrap}>
        <Table<SchemaField>
          rowKey="path"
          loading={isLoading}
          dataSource={fields}
          className={`${styles.dataTable} ${styles.schemaTable}`}
          pagination={false}
          locale={{
            emptyText: t('mongodb.schemaEmpty'),
          }}
          columns={[
            {
              title: t('table.name'),
              dataIndex: 'path',
              key: 'path',
              width: 360,
              ellipsis: true,
            },
            {
              title: t('mongodb.coverage'),
              dataIndex: 'coverage',
              key: 'coverage',
              width: 120,
              render: value => `${Number(value || 0).toFixed(2)}%`,
            },
            {
              title: t('mongodb.required'),
              dataIndex: 'required',
              key: 'required',
              width: 100,
              render: value => (value ? 'YES' : 'NO'),
            },
            {
              title: t('mongodb.types'),
              dataIndex: 'types',
              key: 'types',
              width: 320,
              render: value => (
                <Space size={4} wrap={true}>
                  {(value || []).map((item: { type: string; count: number }) => (
                    <Tag key={`${item.type}-${item.count}`}>{`${item.type} (${item.count})`}</Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: t('mongodb.examples'),
              dataIndex: 'examples',
              key: 'examples',
              render: value => {
                const examples = (value || []) as string[];
                if (!examples.length) return '-';
                return (
                  <div className={styles.schemaExampleList}>
                    {examples.map((item, index) => (
                      <div key={`${item}-${index}`} className={styles.schemaExample}>
                        {item}
                      </div>
                    ))}
                  </div>
                );
              },
            },
          ]}
          scroll={{ x: 'max-content', y: SCHEMA_TABLE_SCROLL_Y }}
        />
      </div>
    </div>
  );
};

export default SchemaPanel;
