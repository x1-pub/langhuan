import React from 'react';
import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import EllipsisText from '@/components/ellipsis-text';
import { formatMongoValue, TMongoIndex } from '../shared';
import styles from '../../index.module.less';

interface IndexesPanelProps {
  collectionIndexes: TMongoIndex[];
  isLoading: boolean;
  isDeleting: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onDeleteIndex: (indexName: string) => void;
}

const IndexesPanel: React.FC<IndexesPanelProps> = ({
  collectionIndexes,
  isLoading,
  isDeleting,
  onRefresh,
  onOpenCreate,
  onDeleteIndex,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.panelBody}>
      <div className={styles.infoBar}>
        <Typography.Text>
          {t('mongodb.indexSummary', { total: collectionIndexes.length })}
        </Typography.Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('button.refresh')}
          </Button>
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={onOpenCreate}>
            {t('mongodb.createIndex')}
          </Button>
        </Space>
      </div>

      <div className={styles.indexesContent}>
        <Table<TMongoIndex>
          loading={isLoading}
          dataSource={collectionIndexes}
          rowKey={record => String(record.name || JSON.stringify(record.key))}
          pagination={false}
          className={styles.dataTable}
          columns={[
            {
              title: t('table.name'),
              dataIndex: 'name',
              width: 220,
            },
            {
              title: t('mongodb.indexKeys'),
              dataIndex: 'key',
              render: value => <EllipsisText text={formatMongoValue(value)} width={360} />,
            },
            {
              title: t('mongodb.indexOptions'),
              key: 'options',
              width: 260,
              render: (_value, record) => {
                const tags: string[] = [];
                if (record.unique) tags.push('unique');
                if (record.sparse) tags.push('sparse');
                if (record.background) tags.push('background');
                if (record.expireAfterSeconds !== undefined) {
                  tags.push(`ttl=${record.expireAfterSeconds}`);
                }
                return tags.length ? (
                  <Space size={4} wrap={true}>
                    {tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                ) : (
                  '-'
                );
              },
            },
            {
              title: t('table.operation'),
              dataIndex: 'name',
              width: 100,
              render: (name: unknown) => {
                const indexName = String(name || '');
                const canDelete = !!indexName && indexName !== '_id_';
                return (
                  <Popconfirm
                    title={t('delete.title')}
                    description={t('delete.desc')}
                    disabled={!canDelete}
                    onConfirm={() => onDeleteIndex(indexName)}
                  >
                    <Button
                      type="text"
                      danger={true}
                      icon={<DeleteOutlined />}
                      disabled={!canDelete}
                      loading={isDeleting}
                    />
                  </Popconfirm>
                );
              },
            },
          ]}
          scroll={{ x: 'max-content', y: 'calc(100vh - 375px)' }}
        />
      </div>
    </div>
  );
};

export default IndexesPanel;
