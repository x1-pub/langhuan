import React, { useMemo, useState } from 'react';
import useMain from '@/utils/use-main';
import { Splitter, Input, Select, Button, Table, type TableProps, Segmented, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
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
import { last, sumBy } from 'lodash';
import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';

import KeyTypeIcon from './key-type-icon';
import styles from './index.module.less';
import AddKeyBox from './add-key-box';
import EditKeyBox from './edit-key-box';
import { formatDuration } from '@/utils/format-duration';
import redisListToTree from '@/utils/redis-list-to-tree';
import useElementSize from '../hooks/use-element-size';
import { trpc } from '@/utils/trpc';
import { ERedisDataType, TRedisKeyViewType } from '@packages/types/redis';

interface IActive {
  key: string;
  type: ERedisDataType;
}

const RedisMain: React.FC = () => {
  const { connectionId, dbName } = useMain();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tableType, setTableType] = useState<TRedisKeyViewType>('list');
  const [type, setType] = useState<ERedisDataType | 'all'>('all');
  const [match, setMatch] = useState<string>();
  const { width, height } = useElementSize('redis-keys-wrap-table');
  const [active, setActive] = useState<IActive | null>(null);
  const [showAddBox, setShowAddBox] = useState<boolean>(false);

  const getKeysInfiniteQuery = useInfiniteQuery(
    trpc.redis.getKeys.infiniteQueryOptions(
      {
        connectionId,
        dbName,
        count: tableType === 'list' ? 500 : 10000,
        match: match || '*',
        type: type === 'all' ? undefined : type,
      },
      {
        getNextPageParam: lastPage => lastPage.nextCursor,
        initialCursor: 0,
      },
    ),
  );

  const getValueQuery = useQuery(
    trpc.redis.getValue.queryOptions(
      {
        connectionId,
        dbName,
        type: active!.type,
        key: active!.key,
      },
      {
        enabled: !!active,
      },
    ),
  );

  const columns: TableProps<ReturnType<typeof redisListToTree>[number]>['columns'] = [
    {
      title: 'type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => {
        if (!record.isLeaf) {
          return record.name;
        }
        return (
          <>
            <KeyTypeIcon type={type} />
            <span style={{ paddingLeft: '5px' }}>{record.name}</span>
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
      render: (ttl, record) => {
        return record.isLeaf ? formatDuration(ttl) : null;
      },
      align: 'right',
      width: 100,
      ellipsis: true,
    },
  ];

  const tableData = useMemo(() => {
    const list = getKeysInfiniteQuery.data?.pages.flatMap(page => page.items) || [];
    return redisListToTree(list, tableType);
  }, [getKeysInfiniteQuery.data?.pages, tableType]);

  const handleAddSuccess = (key: string, type: ERedisDataType) => {
    setShowAddBox(false);
    setActive({ type, key });
    getKeysInfiniteQuery.refetch();
  };

  const handleDeleteKey = () => {
    queryClient.invalidateQueries(getKeysInfiniteQuery);
    setActive(null);
  };

  const handleModifyKey = async (newKey: string) => {
    if (!active) return;

    setActive({ type: active.type, key: newKey });
    queryClient.invalidateQueries(getKeysInfiniteQuery);
    getValueQuery.refetch();
  };

  const handleGetRedisValue = async (record: ReturnType<typeof redisListToTree>[number]) => {
    if (!record.isLeaf) return;

    setShowAddBox(false);
    setActive({ type: record.type!, key: record.key });
  };

  const handleAddKey = () => {
    setActive(null);
    setShowAddBox(true);
  };

  return (
    <div className={styles.redisWrap}>
      <div className={styles.searchGroup}>
        <Input.Search
          addonBefore={
            <Select value={type} style={{ width: '180px' }} onChange={setType}>
              <Select.Option value="all">
                <div style={{ width: '100%', textAlign: 'center' }}>{t('redis.allKeyTypes')}</div>
              </Select.Option>
              {Object.values(ERedisDataType).map(key => (
                <Select.Option value={key} key={key}>
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <KeyTypeIcon type={key} />
                  </div>
                </Select.Option>
              ))}
            </Select>
          }
          allowClear={true}
          placeholder={t('redis.placeholderRedisSearch')}
          onSearch={setMatch}
        />
        <Button type="primary" onClick={handleAddKey}>
          + {t('redis.key')}
        </Button>
      </div>

      <Splitter className={styles.data}>
        {/* 左侧keys */}
        <Splitter.Panel collapsible={true} min={480}>
          <div className={styles.content}>
            <div className={styles.left}>
              <span>
                {t('redis.results')}: {tableData.length}
              </span>
              <span>
                {t('redis.scanned')}: {sumBy(getKeysInfiniteQuery.data?.pages, 'scanned')} /{' '}
                {last(getKeysInfiniteQuery.data?.pages)?.total || 0}
              </span>
              {last(getKeysInfiniteQuery.data?.pages)?.nextCursor !== 0 && (
                <Button
                  size="small"
                  icon={
                    <Tooltip title={t('redis.scanWarn')}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  }
                  onClick={() => getKeysInfiniteQuery.fetchNextPage()}
                >
                  {t('redis.more')}
                </Button>
              )}
            </div>
            <div className={styles.right}>
              <Tooltip title={t('button.refresh')}>
                <ReloadOutlined
                  style={{ cursor: 'pointer' }}
                  onClick={() => queryClient.invalidateQueries(getKeysInfiniteQuery)}
                />
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
                value={tableType}
                onChange={setTableType}
              />
            </div>
          </div>
          <div className={styles.redisKeys} id="redis-keys-wrap-table">
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              showHeader={false}
              onRow={record => ({
                onClick: () => handleGetRedisValue(record),
              })}
              rowClassName={record => {
                return record.key === getValueQuery.data?.key ? styles.avtiveRow : '';
              }}
              size="small"
              tableLayout="fixed"
              rowHoverable={true}
              expandable={{
                indentSize: 12,
                expandRowByClick: true,
                showExpandColumn: tableType === 'tree',
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
        </Splitter.Panel>

        {/* 右侧详情 */}
        <Splitter.Panel collapsible={true} min={420}>
          <div className={styles.redisValue}>
            {showAddBox && (
              <AddKeyBox onAddSuccess={handleAddSuccess} onCancel={() => setShowAddBox(false)} />
            )}
            {!!active && !!getValueQuery.data && (
              <EditKeyBox
                data={getValueQuery.data}
                onDelete={handleDeleteKey}
                onCancel={() => setActive(null)}
                onReload={() => getValueQuery.refetch()}
                onModifyKey={handleModifyKey}
              />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default RedisMain;
