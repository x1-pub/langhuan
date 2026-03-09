import { useMemo } from 'react';
import { Button, Segmented, Table, Tooltip, type TableProps } from 'antd';
import {
  BarsOutlined,
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  NodeExpandOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import KeyTypeIcon from './key-type-icon';
import styles from './index.module.less';
import { formatDuration } from '@/shared/formatters/duration';
import { ERedisDataType, TRedisKeyViewType } from '@packages/types/redis';
import type { RedisTreeNode } from '../hooks/use-redis-main-model';

interface KeysPanelProps {
  containerId: string;
  data: RedisTreeNode[];
  activeKey?: string;
  viewType: TRedisKeyViewType;
  width: number;
  height: number;
  totalScanned: number;
  totalMatched: number;
  hasMorePage: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onSelectViewType: (value: TRedisKeyViewType) => void;
  onSelectKey: (record: RedisTreeNode) => void;
}

const KeysPanel: React.FC<KeysPanelProps> = ({
  containerId,
  data,
  activeKey,
  viewType,
  width,
  height,
  totalScanned,
  totalMatched,
  hasMorePage,
  loading,
  onLoadMore,
  onRefresh,
  onSelectViewType,
  onSelectKey,
}) => {
  const { t } = useTranslation();

  const columns: TableProps<RedisTreeNode>['columns'] = useMemo(
    () => [
      {
        title: 'type',
        dataIndex: 'type',
        key: 'type',
        render: (type: ERedisDataType | undefined, record: RedisTreeNode) => {
          if (!record.isLeaf) {
            return record.name;
          }

          return (
            <>
              {type && <KeyTypeIcon type={type} />}
              <span className={styles.keyName}>{record.name}</span>
            </>
          );
        },
        align: 'left',
        ellipsis: true,
      },
      {
        title: 'ttl',
        dataIndex: 'ttl',
        key: 'ttl',
        render: (ttl, record) => (record.isLeaf ? formatDuration(ttl) : null),
        align: 'right',
        width: 100,
        ellipsis: true,
      },
    ],
    [],
  );

  return (
    <section className={styles.keysPanel}>
      <div className={styles.content}>
        <div className={styles.left}>
          <span>
            {t('redis.results')}: {data.length}
          </span>
          <span>
            {t('redis.scanned')}: {totalScanned} / {totalMatched}
          </span>
          {hasMorePage && (
            <Button
              size="small"
              icon={
                <Tooltip title={t('redis.scanWarn')}>
                  <InfoCircleOutlined />
                </Tooltip>
              }
              onClick={onLoadMore}
            >
              {t('redis.more')}
            </Button>
          )}
        </div>

        <div className={styles.right}>
          <Tooltip title={t('button.refresh')}>
            <ReloadOutlined className={styles.refreshIcon} onClick={onRefresh} />
          </Tooltip>
          <Segmented
            size="small"
            shape="round"
            options={[
              {
                value: 'list',
                icon: (
                  <Tooltip title={t('redis.listView')}>
                    <BarsOutlined />
                  </Tooltip>
                ),
              },
              {
                value: 'tree',
                icon: (
                  <Tooltip title={t('redis.treeView')}>
                    <NodeExpandOutlined />
                  </Tooltip>
                ),
              },
            ]}
            value={viewType}
            onChange={value => onSelectViewType(value as TRedisKeyViewType)}
          />
        </div>
      </div>

      <div className={styles.redisKeys} id={containerId}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          showHeader={false}
          onRow={record => ({ onClick: () => onSelectKey(record) })}
          rowClassName={record => (record.key === activeKey ? styles.activeRow : '')}
          size="small"
          tableLayout="fixed"
          rowHoverable={true}
          expandable={{
            indentSize: 12,
            expandRowByClick: true,
            showExpandColumn: viewType === 'tree',
            expandIcon: ({ expanded, onExpand, record }) => {
              if (record.isLeaf) {
                return null;
              }

              return expanded ? (
                <span>
                  <DownOutlined
                    className={styles.expandIconLeft}
                    onClick={e => onExpand(record, e)}
                  />
                  <FolderOpenOutlined className={styles.expandIconRight} />
                </span>
              ) : (
                <span>
                  <RightOutlined
                    className={styles.expandIconLeft}
                    onClick={e => onExpand(record, e)}
                  />
                  <FolderOutlined className={styles.expandIconRight} />
                </span>
              );
            },
          }}
          scroll={{ x: width, y: height }}
          virtual={true}
        />
      </div>
    </section>
  );
};

export default KeysPanel;
