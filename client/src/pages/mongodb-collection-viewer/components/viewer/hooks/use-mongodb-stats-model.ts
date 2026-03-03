import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/infra/api/trpc';
import { TActiveTab, TMongoStats } from '../../shared';

interface UseMongoStatsModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
  validTableName: boolean;
  activeTab: TActiveTab;
}

export interface StatsPanelModelProps {
  statsData: TMongoStats & {
    [key: string]: unknown;
    storageSize?: number;
    totalIndexSize?: number;
    count?: number;
    estimatedCount?: number;
  };
  isLoading: boolean;
}

interface UseMongoStatsModelResult {
  statsPanelProps: StatsPanelModelProps;
}

const useMongoStatsModel = ({
  connectionId,
  dbName,
  tableName,
  validTableName,
  activeTab,
}: UseMongoStatsModelParams): UseMongoStatsModelResult => {
  const getCollectionStatsQuery = useQuery(
    trpc.mongodb.getCollectionStats.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      {
        enabled: !!connectionId && !!dbName && validTableName && activeTab === 'stats',
      },
    ),
  );

  return {
    statsPanelProps: {
      statsData: (getCollectionStatsQuery.data || {}) as TMongoStats & {
        [key: string]: unknown;
        storageSize?: number;
        totalIndexSize?: number;
        count?: number;
        estimatedCount?: number;
      },
      isLoading: getCollectionStatsQuery.isLoading,
    },
  };
};

export default useMongoStatsModel;
