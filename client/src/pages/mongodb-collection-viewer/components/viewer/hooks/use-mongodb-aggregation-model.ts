import { useEffect, useMemo, useState } from 'react';
import type { TableProps } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { trpcClient } from '@/infra/api/trpc';
import {
  DEFAULT_PIPELINE,
  encodeRowKey,
  IAggregationTableRow,
  TAggregationViewMode,
} from '../../shared';
import { buildDynamicColumns, parseJSONArray } from '../utils';

interface UseMongoAggregationModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
}

export interface AggregationsPanelModelProps {
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

interface UseMongoAggregationModelResult {
  aggregationsPanelProps: AggregationsPanelModelProps;
}

const useMongoAggregationModel = ({
  connectionId,
  dbName,
  tableName,
}: UseMongoAggregationModelParams): UseMongoAggregationModelResult => {
  const { t } = useTranslation();
  const [aggViewMode, setAggViewMode] = useState<TAggregationViewMode>('table');
  const [pipelineText, setPipelineText] = useState(DEFAULT_PIPELINE);
  const [aggregationRows, setAggregationRows] = useState<IAggregationTableRow[]>([]);
  const [allowDiskUse, setAllowDiskUse] = useState(false);
  const [maxTimeMS, setMaxTimeMS] = useState<number | undefined>(30000);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainResult, setExplainResult] = useState('');

  const runAggregationMutation = useMutation({
    mutationFn: async (payload: {
      pipeline: string;
      allowDiskUse: boolean;
      maxTimeMS?: number;
    }) => {
      return trpcClient.mongodb.aggregateCollection.query({
        connectionId,
        dbName,
        tableName: tableName || '',
        pipeline: payload.pipeline,
        allowDiskUse: payload.allowDiskUse,
        maxTimeMS: payload.maxTimeMS,
      });
    },
    onSuccess(data) {
      const rows = data.map((item, index) => {
        return {
          ...(item as Record<string, unknown>),
          __mongo_row_key: encodeRowKey((item as Record<string, unknown>)._id, index, 'agg'),
        } as IAggregationTableRow;
      });

      setAggregationRows(rows);
      if (aggViewMode === 'table' && rows.length === 0) {
        setAggViewMode('json');
      }
    },
  });

  const explainAggregationMutation = useMutation({
    mutationFn: async (payload: {
      pipeline: string;
      allowDiskUse: boolean;
      maxTimeMS?: number;
    }) => {
      return trpcClient.mongodb.explainAggregateCollection.query({
        connectionId,
        dbName,
        tableName: tableName || '',
        pipeline: payload.pipeline,
        allowDiskUse: payload.allowDiskUse,
        maxTimeMS: payload.maxTimeMS,
      });
    },
    onSuccess(data) {
      setExplainResult(JSON.stringify(data, null, 2));
      setExplainOpen(true);
    },
  });

  const handleRunAggregation = async () => {
    const parsedPipeline = parseJSONArray(pipelineText, t('mongodb.pipeline'), t);
    if (!parsedPipeline) {
      return;
    }

    await runAggregationMutation.mutateAsync({
      pipeline: JSON.stringify(parsedPipeline),
      allowDiskUse,
      maxTimeMS,
    });
  };

  const handleExplainAggregation = async () => {
    const parsedPipeline = parseJSONArray(pipelineText, t('mongodb.pipeline'), t);
    if (!parsedPipeline) {
      return;
    }

    await explainAggregationMutation.mutateAsync({
      pipeline: JSON.stringify(parsedPipeline),
      allowDiskUse,
      maxTimeMS,
    });
  };

  const aggregationColumns = useMemo<TableProps<IAggregationTableRow>['columns']>(() => {
    return buildDynamicColumns(aggregationRows);
  }, [aggregationRows]);

  useEffect(() => {
    setAggViewMode('table');
    setPipelineText(DEFAULT_PIPELINE);
    setAggregationRows([]);
    setAllowDiskUse(false);
    setMaxTimeMS(30000);
    setExplainOpen(false);
    setExplainResult('');
  }, [dbName, tableName]);

  return {
    aggregationsPanelProps: {
      pipelineText,
      setPipelineText,
      allowDiskUse,
      setAllowDiskUse,
      maxTimeMS,
      setMaxTimeMS,
      onRunAggregation: handleRunAggregation,
      onExplainAggregation: handleExplainAggregation,
      explainOpen,
      explainResult,
      onCloseExplain: () => setExplainOpen(false),
      isRunning: runAggregationMutation.isPending,
      isExplaining: explainAggregationMutation.isPending,
      aggViewMode,
      setAggViewMode,
      aggregationRows,
      aggregationColumns,
    },
  };
};

export default useMongoAggregationModel;
