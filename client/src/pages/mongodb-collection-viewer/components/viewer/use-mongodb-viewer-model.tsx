import { useEffect, useState } from 'react';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import type { DocumentsPanelProps } from '../panels/documents-panel';
import { TActiveTab } from '../shared';
import {
  useMongoAggregationModel,
  useMongoDocumentsModel,
  useMongoIndexesModel,
  useMongoSchemaModel,
  useMongoStatsModel,
  useMongoValidationModel,
  AggregationsPanelModelProps,
  DocumentEditorModalModelProps,
  IndexEditorModalModelProps,
  IndexesPanelModelProps,
  SchemaPanelModelProps,
  StatsPanelModelProps,
  ValidationPanelModelProps,
} from './hooks';

interface UseMongoViewerModelResult {
  validTableName: boolean;
  activeTab: TActiveTab;
  setActiveTab: (tab: TActiveTab) => void;
  documentsPanelProps: DocumentsPanelProps;
  aggregationsPanelProps: AggregationsPanelModelProps;
  indexesPanelProps: IndexesPanelModelProps;
  validationPanelProps: ValidationPanelModelProps;
  schemaPanelProps: SchemaPanelModelProps;
  statsPanelProps: StatsPanelModelProps;
  documentEditorModalProps: DocumentEditorModalModelProps;
  indexEditorModalProps: IndexEditorModalModelProps;
}

const useMongoViewerModel = (): UseMongoViewerModelResult => {
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [activeTab, setActiveTab] = useState<TActiveTab>('documents');
  const validTableName = !!tableName && tableName !== 'NO_TABLE';

  const { documentsPanelProps, documentEditorModalProps } = useMongoDocumentsModel({
    connectionId,
    dbName,
    tableName,
    validTableName,
  });
  const { aggregationsPanelProps } = useMongoAggregationModel({
    connectionId,
    dbName,
    tableName,
  });
  const { indexesPanelProps, indexEditorModalProps } = useMongoIndexesModel({
    connectionId,
    dbName,
    tableName,
    validTableName,
    activeTab,
  });
  const { validationPanelProps } = useMongoValidationModel({
    connectionId,
    dbName,
    tableName,
    validTableName,
    activeTab,
  });
  const { schemaPanelProps } = useMongoSchemaModel({
    connectionId,
    dbName,
    tableName,
    validTableName,
    activeTab,
  });
  const { statsPanelProps } = useMongoStatsModel({
    connectionId,
    dbName,
    tableName,
    validTableName,
    activeTab,
  });

  useEffect(() => {
    setActiveTab('documents');
  }, [dbName, tableName]);

  return {
    validTableName,
    activeTab,
    setActiveTab,
    documentsPanelProps,
    aggregationsPanelProps,
    indexesPanelProps,
    validationPanelProps,
    schemaPanelProps,
    statsPanelProps,
    documentEditorModalProps,
    indexEditorModalProps,
  };
};

export default useMongoViewerModel;
