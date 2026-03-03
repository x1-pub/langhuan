import React from 'react';
import {
  Badge,
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Space,
  type TableProps,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  LeftOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  RightOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { IMongoTableRow, IDocumentQueryState, TDocumentViewMode } from '../shared';
import { DocumentsContent } from './documents';
import styles from '../../index.module.less';

export interface DocumentsPanelProps {
  queryDraft: IDocumentQueryState;
  setQueryDraft: React.Dispatch<React.SetStateAction<IDocumentQueryState>>;
  onApplyQuery: () => void;
  onResetQuery: () => void;
  onSkipMove: (direction: 'prev' | 'next') => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  current: number;
  pageSize: number;
  onTablePageChange: (page: number, pageSize: number) => void;
  documentRows: IMongoTableRow[];
  documentColumns: TableProps<IMongoTableRow>['columns'];
  isLoading: boolean;
  selectedRowKeys: string[];
  selectedRows: IMongoTableRow[];
  onSelectedRowKeysChange: (keys: string[]) => void;
  onOpenEdit: (row: IMongoTableRow) => void;
  onDeleteByIds: (ids: unknown[]) => void;
  onOpenCreate: () => void;
  resultTotal: number;
  docViewMode: TDocumentViewMode;
  setDocViewMode: (value: TDocumentViewMode) => void;
  listExpandedMap: Record<string, boolean>;
  onToggleListExpanded: (path: string) => void;
  onToggleRowSelection: (rowKey: string, checked: boolean) => void;
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({
  queryDraft,
  setQueryDraft,
  onApplyQuery,
  onResetQuery,
  onSkipMove,
  canGoPrev,
  canGoNext,
  current,
  pageSize,
  onTablePageChange,
  documentRows,
  documentColumns,
  isLoading,
  selectedRowKeys,
  selectedRows,
  onSelectedRowKeysChange,
  onOpenEdit,
  onDeleteByIds,
  onOpenCreate,
  resultTotal,
  docViewMode,
  setDocViewMode,
  listExpandedMap,
  onToggleListExpanded,
  onToggleRowSelection,
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className={styles.panelBody}>
      <div className={styles.queryBar}>
        <div className={styles.queryTop}>
          <div className={styles.queryFilterField}>
            <span className={styles.queryLabel}>{t('mongodb.filter')}</span>
            <Input
              value={queryDraft.filter}
              onChange={event => setQueryDraft(prev => ({ ...prev, filter: event.target.value }))}
              className={styles.queryInput}
              placeholder={t('mongodb.filterPlaceholder')}
            />
          </div>
          <div className={styles.queryActions}>
            <Button onClick={onResetQuery}>{t('button.reset')}</Button>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={onApplyQuery}>
              {t('button.search')}
            </Button>
            <Button
              type="text"
              className={styles.optionsButton}
              onClick={() => setShowAdvanced(prev => !prev)}
            >
              {t('mongodb.options')}
              {showAdvanced ? <UpOutlined /> : <DownOutlined />}
            </Button>
          </div>
        </div>

        {showAdvanced && (
          <div className={styles.queryAdvanced}>
            <div className={styles.queryField}>
              <span className={styles.queryLabel}>{t('mongodb.project')}</span>
              <Input
                value={queryDraft.projection}
                onChange={event =>
                  setQueryDraft(prev => ({ ...prev, projection: event.target.value }))
                }
                className={styles.queryInput}
              />
            </div>
            <div className={styles.queryField}>
              <span className={styles.queryLabel}>{t('mongodb.sort')}</span>
              <Input
                value={queryDraft.sort}
                onChange={event => setQueryDraft(prev => ({ ...prev, sort: event.target.value }))}
                className={styles.queryInput}
                placeholder={t('mongodb.sortPlaceholder')}
              />
            </div>
            <div className={styles.queryFieldSmall}>
              <span className={styles.queryLabel}>{t('mongodb.skip')}</span>
              <InputNumber
                min={0}
                value={queryDraft.skip}
                className={styles.numberInput}
                onChange={value =>
                  setQueryDraft(prev => ({ ...prev, skip: Math.max(0, Number(value || 0)) }))
                }
              />
            </div>
            <div className={styles.queryFieldSmall}>
              <span className={styles.queryLabel}>{t('mongodb.limit')}</span>
              <InputNumber
                min={1}
                value={queryDraft.limit}
                className={styles.numberInput}
                onChange={value =>
                  setQueryDraft(prev => ({ ...prev, limit: Math.max(1, Number(value || 1)) }))
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.infoBar}>
        <Space>
          <Button type="dashed" icon={<PlusOutlined />} onClick={onOpenCreate}>
            {t('mongodb.addDocument')}
          </Button>
          <Button
            icon={<EditOutlined />}
            disabled={selectedRows.length !== 1}
            onClick={() => onOpenEdit(selectedRows[0])}
          >
            {t('button.edit')}
          </Button>
          <Popconfirm
            title={t('delete.title')}
            description={t('delete.desc')}
            onConfirm={() =>
              onDeleteByIds(selectedRows.map(row => row._id).filter(id => id !== undefined))
            }
            disabled={selectedRows.length === 0}
          >
            <Button danger={true} icon={<DeleteOutlined />} disabled={selectedRows.length === 0}>
              {t('button.delete')}
            </Button>
          </Popconfirm>
        </Space>

        <Space align="center">
          <Badge
            color="var(--theme-main-color)"
            text={
              docViewMode === 'table'
                ? t('mongodb.total', { total: resultTotal })
                : t('mongodb.resultSummary', {
                    current: documentRows.length,
                    total: resultTotal,
                  })
            }
          />
          {docViewMode !== 'table' && (
            <Space size={8}>
              <span
                className={`${styles.pagerIcon} ${!canGoPrev ? styles.pagerIconDisabled : ''}`}
                onClick={() => {
                  if (canGoPrev) {
                    onSkipMove('prev');
                  }
                }}
                onKeyDown={event => {
                  if (canGoPrev && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSkipMove('prev');
                  }
                }}
                title={t('mongodb.prevPage')}
                aria-label={t('mongodb.prevPage')}
                aria-disabled={!canGoPrev}
                role="button"
                tabIndex={canGoPrev ? 0 : -1}
              >
                <LeftOutlined />
              </span>
              <span
                className={`${styles.pagerIcon} ${!canGoNext ? styles.pagerIconDisabled : ''}`}
                onClick={() => {
                  if (canGoNext) {
                    onSkipMove('next');
                  }
                }}
                onKeyDown={event => {
                  if (canGoNext && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSkipMove('next');
                  }
                }}
                title={t('mongodb.nextPage')}
                aria-label={t('mongodb.nextPage')}
                aria-disabled={!canGoNext}
                role="button"
                tabIndex={canGoNext ? 0 : -1}
              >
                <RightOutlined />
              </span>
            </Space>
          )}
          <Segmented<TDocumentViewMode>
            value={docViewMode}
            onChange={setDocViewMode}
            options={[
              { label: t('mongodb.tableView'), value: 'table' },
              { label: t('mongodb.listView'), value: 'list' },
              { label: t('mongodb.jsonView'), value: 'json' },
            ]}
          />
        </Space>
      </div>

      <DocumentsContent
        docViewMode={docViewMode}
        documentRows={documentRows}
        documentColumns={documentColumns}
        isLoading={isLoading}
        selectedRowKeys={selectedRowKeys}
        onSelectedRowKeysChange={onSelectedRowKeysChange}
        onOpenEdit={onOpenEdit}
        onDeleteByIds={onDeleteByIds}
        listExpandedMap={listExpandedMap}
        onToggleListExpanded={onToggleListExpanded}
        onToggleRowSelection={onToggleRowSelection}
        current={current}
        pageSize={pageSize}
        total={resultTotal}
        onChangePage={onTablePageChange}
      />
    </div>
  );
};

export default DocumentsPanel;
