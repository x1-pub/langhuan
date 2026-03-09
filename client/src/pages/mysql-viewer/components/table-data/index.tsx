import React, { useEffect } from 'react';
import { Button, Popconfirm, Table, Tooltip } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Editor from './editor';
import BatchEditor from './batch-editor';
import ExportDataModal from './export';
import styles from './index.module.less';
import SqlWhereEditor from '@/components/sql-where-editor';
import useMySQLTableDataModel from '@/domain/mysql/hooks/use-mysql-table-data-model';
import { MYSQL_TABLE_ROW_KEY_FIELD } from '@/domain/mysql/model/table-data';
import { MYSQL_WHERE_KEYWORDS } from '@/domain/mysql/model/sql-keywords';
import useTableScrollY from '@/shared/ui/hooks/use-table-scroll-y';

const TableData: React.FC = () => {
  const { t } = useTranslation();
  const {
    whereDraft,
    columns,
    fields,
    total,
    loading,
    pagination,
    pageSizeOptions,
    selectedRowKeys,
    hasPrimaryKey,
    tableColumns,
    tableRows,
    editorRows,
    editorCondition,
    exportVisible,
    selectionColumnWidth,
    changeWhereDraft,
    applySearch,
    resetSearch,
    changePagination,
    changeSelectedRowKeys,
    openCreateEditor,
    openSingleEditor,
    openBatchEditor,
    closeEditor,
    submitEditor,
    deleteSelectedRows,
    openExportModal,
    closeExportModal,
  } = useMySQLTableDataModel();

  const hasSelection = selectedRowKeys.length > 0;
  const showPrimaryKeyWarning = !loading && columns.length > 0 && !hasPrimaryKey;
  const { containerRef, scrollY, recalcScrollY } = useTableScrollY();

  useEffect(() => {
    recalcScrollY();
  }, [
    recalcScrollY,
    tableRows.length,
    tableColumns?.length,
    total,
    pagination.current,
    pagination.pageSize,
    loading,
  ]);

  return (
    <div className={styles.panel}>
      <SqlWhereEditor
        value={whereDraft}
        fields={fields}
        keywords={MYSQL_WHERE_KEYWORDS}
        onChange={changeWhereDraft}
        tips={
          <>
            <div>{t('mysql.whereTip1')}</div>
            <div>(1) WHERE id = 10 AND name LIKE '%cat%'</div>
            <div>(2) WHERE age &gt;= 18 ORDER BY age DESC</div>
            <div>(3) WHERE year IN ('2024','2025')</div>
            <div>{t('mysql.whereTip2')}</div>
          </>
        }
      />

      <div className={styles.buttonGroup}>
        {showPrimaryKeyWarning && (
          <Tooltip title={t('mysql.noPriTips')}>
            <WarningOutlined className={styles.warn} />
          </Tooltip>
        )}
        <Button onClick={openCreateEditor}>{t('button.add')}</Button>
        <Button disabled={!hasSelection} onClick={openBatchEditor}>
          {t('button.update')}
        </Button>
        <Popconfirm
          title={t('delete.title')}
          description={t('delete.desc')}
          onConfirm={deleteSelectedRows}
        >
          <Button disabled={!hasSelection} danger>
            {t('button.delete')}
          </Button>
        </Popconfirm>
        <Button disabled={!hasSelection} onClick={openExportModal}>
          {t('button.export')}
        </Button>
        <Button onClick={resetSearch}>{t('button.reset')}</Button>
        <Button type="primary" onClick={applySearch}>
          {t('button.search')}
        </Button>
      </div>

      <div className={styles.tableWrap} ref={containerRef}>
        <Table
          className={styles.dataTable}
          rowKey={MYSQL_TABLE_ROW_KEY_FIELD}
          loading={loading}
          columns={tableColumns}
          dataSource={tableRows}
          scroll={{ x: 'max-content', y: scrollY }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: pageSizeOptions.map(option => String(option)),
            total,
            current: pagination.current,
            pageSize: pagination.pageSize,
            defaultPageSize: pageSizeOptions[1],
            showTotal: all => t('mysql.total', { total: all }),
          }}
          onChange={changePagination}
          rowSelection={{
            fixed: true,
            columnWidth: selectionColumnWidth,
            selectedRowKeys,
            onChange: changeSelectedRowKeys,
          }}
          onRow={record => ({
            onDoubleClick: () => openSingleEditor(record),
          })}
        />
      </div>

      <Editor
        data={editorRows[0]}
        onOk={submitEditor}
        onCancel={closeEditor}
        show={editorRows.length === 1}
        columns={columns}
        condition={editorCondition}
      />

      <BatchEditor
        onOk={submitEditor}
        onCancel={closeEditor}
        show={editorRows.length > 1}
        columns={columns}
        condition={editorCondition}
      />

      <ExportDataModal
        visible={exportVisible}
        condition={editorCondition}
        fields={fields}
        onOk={closeExportModal}
        onCancel={closeExportModal}
      />
    </div>
  );
};

export default TableData;
