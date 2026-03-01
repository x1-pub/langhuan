import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/utils/trpc';
import { TActiveTab, TMongoSchemaAnalysis } from '../../shared';

interface UseMongoSchemaModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
  validTableName: boolean;
  activeTab: TActiveTab;
}

export interface SchemaPanelModelProps {
  sampleSize: number;
  onChangeSampleSize: (value: number) => void;
  isLoading: boolean;
  onAnalyze: () => void;
  onRefresh: () => void;
  schemaData?: TMongoSchemaAnalysis;
}

interface UseMongoSchemaModelResult {
  schemaPanelProps: SchemaPanelModelProps;
}

const DEFAULT_SAMPLE_SIZE = 200;

const useMongoSchemaModel = ({
  connectionId,
  dbName,
  tableName,
  validTableName,
  activeTab,
}: UseMongoSchemaModelParams): UseMongoSchemaModelResult => {
  const [sampleSizeDraft, setSampleSizeDraft] = useState(DEFAULT_SAMPLE_SIZE);
  const [sampleSizeApplied, setSampleSizeApplied] = useState(DEFAULT_SAMPLE_SIZE);

  const getSchemaQuery = useQuery(
    trpc.mongodb.analyzeCollectionSchema.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
        sampleSize: sampleSizeApplied,
      },
      {
        enabled: !!connectionId && !!dbName && validTableName && activeTab === 'schema',
      },
    ),
  );

  const handleAnalyze = () => {
    const safeSampleSize = Math.max(10, Math.min(5000, Number(sampleSizeDraft || 10)));
    setSampleSizeDraft(safeSampleSize);

    if (safeSampleSize !== sampleSizeApplied) {
      setSampleSizeApplied(safeSampleSize);
      return;
    }

    getSchemaQuery.refetch();
  };

  useEffect(() => {
    setSampleSizeDraft(DEFAULT_SAMPLE_SIZE);
    setSampleSizeApplied(DEFAULT_SAMPLE_SIZE);
  }, [dbName, tableName]);

  const schemaPanelProps = useMemo(
    () => ({
      sampleSize: sampleSizeDraft,
      onChangeSampleSize: (value: number) =>
        setSampleSizeDraft(Math.max(10, Math.min(5000, Number(value || 10)))),
      isLoading: getSchemaQuery.isLoading || getSchemaQuery.isFetching,
      onAnalyze: handleAnalyze,
      onRefresh: () => getSchemaQuery.refetch(),
      schemaData: getSchemaQuery.data as TMongoSchemaAnalysis | undefined,
    }),
    [sampleSizeDraft, getSchemaQuery.isLoading, getSchemaQuery.isFetching, getSchemaQuery.data],
  );

  return {
    schemaPanelProps,
  };
};

export default useMongoSchemaModel;
