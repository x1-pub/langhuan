import React, { useMemo, useState } from 'react';
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

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import KeyTypeIcon from './key-type-icon';
import styles from './index.module.less';
import AddKeyBox from './add-key-box';
import EditKeyBox from './edit-key-box';
import { formatDuration } from '@/shared/formatters/duration';
import redisListToTree from '@/domain/redis/model/redis-key-tree';
import useElementSize from '../hooks/use-element-size';
import { trpc } from '@/infra/api/trpc';
import { ERedisDataType, TRedisKeyViewType } from '@packages/types/redis';

interface ActiveRedisKey {
  key: string;
  type: ERedisDataType;
}

type RedisTreeNode = ReturnType<typeof redisListToTree>[number];

const RedisMain: React.FC = () => {
  const { connectionId, dbName } = useDatabaseWindows();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [viewType, setViewType] = useState<TRedisKeyViewType>('list');
  const [keyTypeFilter, setKeyTypeFilter] = useState<ERedisDataType | 'all'>('all');
  const [searchPattern, setSearchPattern] = useState<string>();
  const [activeKey, setActiveKey] = useState<ActiveRedisKey | null>(null);
  const [showAddKeyPanel, setShowAddKeyPanel] = useState(false);

  const { width, height } = useElementSize('redis-keys-wrap-table');

  const keyListQueryOptions = trpc.redis.getKeys.infiniteQueryOptions(
    {
      connectionId,
      dbName,
      count: viewType === 'list' ? 500 : 10000,
      match: searchPattern || '*',
      type: keyTypeFilter === 'all' ? undefined : keyTypeFilter,
    },
    {
      getNextPageParam: page => page.nextCursor,
      initialCursor: 0,
    },
  );

  const keyListQuery = useInfiniteQuery(keyListQueryOptions);

  const valueQuery = useQuery(
    trpc.redis.getValue.queryOptions(
      {
        connectionId,
        dbName,
        type: activeKey?.type ?? ('' as never),
        key: activeKey?.key ?? ('' as never),
      },
      { enabled: Boolean(activeKey) },
    ),
  );

  const pages = keyListQuery.data?.pages ?? [];
  const lastPage = last(pages);
  const hasMorePage = Boolean(lastPage && lastPage.nextCursor !== 0);
  const totalScanned = sumBy(pages, page => page.scanned);
  const totalMatched = lastPage?.total ?? 0;

  const tableData = useMemo(() => {
    const list = pages.flatMap(page => page.items);
    return redisListToTree(list, viewType);
  }, [pages, viewType]);

  const invalidateKeyList = () => {
    void queryClient.invalidateQueries({ queryKey: keyListQueryOptions.queryKey });
  };

  const handleAddSuccess = (key: string, type: ERedisDataType) => {
    setShowAddKeyPanel(false);
    setActiveKey({ type, key });
    void keyListQuery.refetch();
  };

  const handleDeleteKey = () => {
    invalidateKeyList();
    setActiveKey(null);
  };

  const handleModifyKey = async (nextKey: string) => {
    if (!activeKey) {
      return;
    }

    setActiveKey({ type: activeKey.type, key: nextKey });
    invalidateKeyList();
    await valueQuery.refetch();
  };

  const handleSelectRedisKey = (record: RedisTreeNode) => {
    if (!record.isLeaf || !record.type) {
      return;
    }

    setShowAddKeyPanel(false);
    setActiveKey({ type: record.type, key: record.key });
  };

  const handleOpenAddKeyPanel = () => {
    setActiveKey(null);
    setShowAddKeyPanel(true);
  };

  const columns: TableProps<RedisTreeNode>['columns'] = [
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
  ];

  return (
    <div className={styles.redisWrap}>
      <div className={styles.searchGroup}>
        <Input.Search
          addonBefore={
            <Select value={keyTypeFilter} style={{ width: '180px' }} onChange={setKeyTypeFilter}>
              <Select.Option value="all">
                <div className={styles.typeOption}>{t('redis.allKeyTypes')}</div>
              </Select.Option>
              {Object.values(ERedisDataType).map(type => (
                <Select.Option value={type} key={type}>
                  <div className={styles.typeOption}>
                    <KeyTypeIcon type={type} />
                  </div>
                </Select.Option>
              ))}
            </Select>
          }
          allowClear={true}
          placeholder={t('redis.placeholderRedisSearch')}
          onSearch={setSearchPattern}
        />
        <Button type="primary" onClick={handleOpenAddKeyPanel}>
          + {t('redis.key')}
        </Button>
      </div>

      <Splitter className={styles.data}>
        <Splitter.Panel collapsible={true} min={480}>
          <section className={styles.keysPanel}>
            <div className={styles.content}>
              <div className={styles.left}>
                <span>
                  {t('redis.results')}: {tableData.length}
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
                    onClick={() => keyListQuery.fetchNextPage()}
                  >
                    {t('redis.more')}
                  </Button>
                )}
              </div>

              <div className={styles.right}>
                <Tooltip title={t('button.refresh')}>
                  <ReloadOutlined className={styles.refreshIcon} onClick={invalidateKeyList} />
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
                  onChange={value => setViewType(value as TRedisKeyViewType)}
                />
              </div>
            </div>

            <div className={styles.redisKeys} id="redis-keys-wrap-table">
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                showHeader={false}
                onRow={record => ({ onClick: () => handleSelectRedisKey(record) })}
                rowClassName={record =>
                  record.key === valueQuery.data?.key ? styles.activeRow : ''
                }
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
        </Splitter.Panel>

        <Splitter.Panel collapsible={true} min={420}>
          <section className={styles.valuePanel}>
            <div className={styles.redisValue}>
              {showAddKeyPanel && (
                <AddKeyBox
                  onAddSuccess={handleAddSuccess}
                  onCancel={() => setShowAddKeyPanel(false)}
                />
              )}
              {activeKey && valueQuery.data && (
                <EditKeyBox
                  data={valueQuery.data}
                  onDelete={handleDeleteKey}
                  onCancel={() => setActiveKey(null)}
                  onReload={() => valueQuery.refetch()}
                  onModifyKey={handleModifyKey}
                />
              )}
            </div>
          </section>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default RedisMain;
