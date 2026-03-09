import { useMemo, useState } from 'react';
import { last, sumBy } from 'lodash';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import redisListToTree from '@/domain/redis/model/redis-key-tree';
import useElementSize from './use-element-size';
import { trpc } from '@/infra/api/trpc';
import { ERedisDataType, TRedisKeyViewType } from '@packages/types/redis';

export interface ActiveRedisKey {
  key: string;
  type: ERedisDataType;
}

export type RedisTreeNode = ReturnType<typeof redisListToTree>[number];

const REDIS_KEYS_CONTAINER_ID = 'redis-keys-wrap-table';

export const useRedisMainModel = () => {
  const { connectionId, dbName } = useDatabaseWindows();
  const queryClient = useQueryClient();
  const [viewType, setViewType] = useState<TRedisKeyViewType>('list');
  const [keyTypeFilter, setKeyTypeFilter] = useState<ERedisDataType | 'all'>('all');
  const [searchPattern, setSearchPattern] = useState<string>();
  const [activeKey, setActiveKey] = useState<ActiveRedisKey | null>(null);
  const [showAddKeyPanel, setShowAddKeyPanel] = useState(false);
  const { width, height } = useElementSize(REDIS_KEYS_CONTAINER_ID);

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
  const totalScanned = sumBy(pages, page => page.scanned);
  const totalMatched = lastPage?.total ?? 0;
  const hasMorePage = Boolean(lastPage && lastPage.nextCursor !== 0);
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
    setActiveKey(null);
    invalidateKeyList();
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

  return {
    keyTypeFilter,
    viewType,
    searchPattern,
    activeKey,
    showAddKeyPanel,
    keyListQuery,
    valueQuery,
    tableData,
    totalScanned,
    totalMatched,
    hasMorePage,
    width,
    height,
    containerId: REDIS_KEYS_CONTAINER_ID,
    setViewType,
    setKeyTypeFilter,
    setSearchPattern,
    setActiveKey,
    setShowAddKeyPanel,
    handleSelectRedisKey,
    handleOpenAddKeyPanel,
    handleAddSuccess,
    handleDeleteKey,
    handleModifyKey,
    invalidateKeyList,
  };
};

export default useRedisMainModel;
