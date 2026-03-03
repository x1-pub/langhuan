import React from 'react';
import { Button, Card, Popconfirm, Space, Table, type TableProps } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { DEFAULT_PAGE_SIZE, IMongoTableRow, TDocumentViewMode, ROW_KEY_FIELD } from '../../shared';
import DocumentListCard from './document-list-card';
import styles from '../../../index.module.less';

interface DocumentsContentProps {
  docViewMode: TDocumentViewMode;
  documentRows: IMongoTableRow[];
  documentColumns: TableProps<IMongoTableRow>['columns'];
  isLoading: boolean;
  selectedRowKeys: string[];
  onSelectedRowKeysChange: (keys: string[]) => void;
  onOpenEdit: (row: IMongoTableRow) => void;
  onDeleteByIds: (ids: unknown[]) => void;
  listExpandedMap: Record<string, boolean>;
  onToggleListExpanded: (path: string) => void;
  onToggleRowSelection: (rowKey: string, checked: boolean) => void;
  current: number;
  pageSize: number;
  total: number;
  onChangePage: (page: number, pageSize: number) => void;
}

const DocumentsContent: React.FC<DocumentsContentProps> = ({
  docViewMode,
  documentRows,
  documentColumns,
  isLoading,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onOpenEdit,
  onDeleteByIds,
  listExpandedMap,
  onToggleListExpanded,
  onToggleRowSelection,
  current,
  pageSize,
  total,
  onChangePage,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.documentsContent}>
      {docViewMode === 'table' ? (
        <Table<IMongoTableRow>
          rowKey={ROW_KEY_FIELD}
          columns={documentColumns}
          dataSource={documentRows}
          loading={isLoading}
          className={styles.dataTable}
          scroll={{ x: 'max-content', y: 'calc(100vh - 375px)' }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: [10, DEFAULT_PAGE_SIZE, 50, 100, 500],
            total,
            current,
            pageSize,
            defaultPageSize: DEFAULT_PAGE_SIZE,
            showTotal: all => t('mongodb.total', { total: all }),
          }}
          onChange={pagination => {
            onChangePage(pagination.current || 1, pagination.pageSize || pageSize);
          }}
          rowSelection={{
            fixed: true,
            columnWidth: 24,
            selectedRowKeys,
            onChange: keys => onSelectedRowKeysChange(keys as string[]),
          }}
          onRow={record => ({
            onDoubleClick: () => onOpenEdit(record),
          })}
        />
      ) : docViewMode === 'list' ? (
        <div className={styles.listCards}>
          {documentRows.map(row => (
            <DocumentListCard
              key={row[ROW_KEY_FIELD]}
              row={row}
              selected={selectedRowKeys.includes(row[ROW_KEY_FIELD])}
              onToggleRowSelection={onToggleRowSelection}
              onOpenEdit={onOpenEdit}
              onDeleteByIds={onDeleteByIds}
              listExpandedMap={listExpandedMap}
              onToggleListExpanded={onToggleListExpanded}
            />
          ))}
        </div>
      ) : (
        <div className={styles.jsonCards}>
          {documentRows.map(row => {
            const { __mongo_row_key: rowKey, ...doc } = row;
            const disableEdit = doc._id === undefined;

            return (
              <Card
                key={rowKey}
                size="small"
                className={styles.jsonCard}
                title={String(doc._id || t('mongodb.noId'))}
                extra={
                  <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => onOpenEdit(row)} />
                    <Popconfirm
                      title={t('delete.title')}
                      description={t('delete.desc')}
                      disabled={disableEdit}
                      onConfirm={() => {
                        if (doc._id !== undefined) {
                          onDeleteByIds([doc._id]);
                        }
                      }}
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger={true}
                        disabled={disableEdit}
                      />
                    </Popconfirm>
                  </Space>
                }
              >
                <pre className={styles.jsonCode}>{JSON.stringify(doc, null, 2)}</pre>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsContent;
