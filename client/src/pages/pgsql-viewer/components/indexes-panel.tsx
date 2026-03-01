import React from 'react';
import { Button, Checkbox, Input, Popconfirm, Select, Space, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';

interface IndexesPanelProps {
  loading: boolean;
  indexes: Array<{
    name: string;
    definition: string;
  }>;
  columnOptions: Array<{
    label: string;
    value: string;
  }>;
  draft: {
    indexName: string;
    method: string;
    columns: string[];
    unique: boolean;
  };
  isCreating: boolean;
  isDropping: boolean;
  onChangeDraft: (draft: Partial<IndexesPanelProps['draft']>) => void;
  onCreateIndex: () => void;
  onDropIndex: (indexName: string) => void;
}

const IndexesPanel: React.FC<IndexesPanelProps> = ({
  loading,
  indexes,
  columnOptions,
  draft,
  isCreating,
  isDropping,
  onChangeDraft,
  onCreateIndex,
  onDropIndex,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.panel}>
      <div className={styles.queryBar}>
        <div className={styles.field}>
          <span>{t('pgsql.indexName')}</span>
          <Input
            value={draft.indexName}
            onChange={event => onChangeDraft({ indexName: event.target.value })}
          />
        </div>
        <div className={styles.fieldSmall}>
          <span>{t('pgsql.indexMethod')}</span>
          <Input
            value={draft.method}
            onChange={event => onChangeDraft({ method: event.target.value })}
          />
        </div>
        <div className={styles.field}>
          <span>{t('pgsql.indexColumns')}</span>
          <Select
            mode="multiple"
            allowClear
            options={columnOptions}
            value={draft.columns}
            onChange={columns => onChangeDraft({ columns })}
          />
        </div>
        <div className={styles.fieldSmall}>
          <span>{t('pgsql.uniqueIndex')}</span>
          <Checkbox
            checked={draft.unique}
            onChange={event => onChangeDraft({ unique: event.target.checked })}
          >
            {t('pgsql.uniqueIndex')}
          </Checkbox>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={isCreating}
            onClick={onCreateIndex}
          >
            {t('pgsql.createIndex')}
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <Table
          rowKey="name"
          loading={loading}
          dataSource={indexes}
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100vh - 375px)' }}
          columns={[
            {
              title: t('pgsql.indexName'),
              dataIndex: 'name',
              width: 260,
            },
            {
              title: t('table.statement'),
              dataIndex: 'definition',
            },
            {
              title: t('table.operation'),
              key: 'operation',
              width: 96,
              align: 'center',
              render: (_, row) => (
                <Popconfirm
                  title={t('delete.title')}
                  description={t('delete.desc')}
                  onConfirm={() => onDropIndex(row.name)}
                >
                  <Button
                    type="text"
                    danger={true}
                    icon={<DeleteOutlined />}
                    loading={isDropping}
                  />
                </Popconfirm>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default IndexesPanel;
