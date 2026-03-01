import React from 'react';
import { Input, Modal, Segmented, Space, Table } from 'antd';
import { useTranslation } from 'react-i18next';

import RawDataEditor from '@/components/raw-data-editor';
import styles from '../index.module.less';

type TEditorMode = 'form' | 'json';

interface RowEditorModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  content: string;
  columns: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue: string | null;
    comment: string | null;
    isPrimaryKey: boolean;
    isIdentity: boolean;
    identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
  }>;
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onChangeContent: (value: string) => void;
}

const RowEditorModal: React.FC<RowEditorModalProps> = ({
  open,
  mode,
  content,
  columns,
  loading,
  onCancel,
  onSubmit,
  onChangeContent,
}) => {
  const { t } = useTranslation();
  const [editorMode, setEditorMode] = React.useState<TEditorMode>('form');

  React.useEffect(() => {
    if (open) {
      setEditorMode('form');
    }
  }, [open]);

  const parsed = React.useMemo(() => {
    try {
      const next = JSON.parse(content);
      if (next && !Array.isArray(next) && typeof next === 'object') {
        return next as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }, [content]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    const next = {
      ...parsed,
      [fieldName]: value,
    };
    onChangeContent(JSON.stringify(next, null, 2));
  };

  const tableData = columns.map(column => ({
    key: column.name,
    ...column,
    value: parsed[column.name],
  }));

  return (
    <Modal
      open={open}
      width={900}
      maskClosable={false}
      title={mode === 'create' ? t('pgsql.createRow') : t('pgsql.editRow')}
      onCancel={onCancel}
      onOk={onSubmit}
      okButtonProps={{ loading }}
      destroyOnHidden
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Segmented<TEditorMode>
          value={editorMode}
          onChange={value => setEditorMode(value)}
          options={[
            { label: t('pgsql.formEditor'), value: 'form' },
            { label: t('pgsql.jsonEditor'), value: 'json' },
          ]}
        />

        {editorMode === 'form' ? (
          <Table
            rowKey="key"
            pagination={false}
            className={styles.rowEditorTable}
            dataSource={tableData}
            columns={[
              {
                title: t('table.field'),
                dataIndex: 'name',
                width: 240,
                ellipsis: true,
              },
              {
                title: t('table.value'),
                dataIndex: 'value',
                render: (_, row) => (
                  <RawDataEditor
                    engine="pgsql"
                    type={row.dataType}
                    value={row.value}
                    onChange={value => handleFieldChange(row.name, value)}
                  />
                ),
              },
              {
                title: t('table.type'),
                dataIndex: 'dataType',
                width: 180,
                ellipsis: true,
              },
              {
                title: t('table.default'),
                dataIndex: 'defaultValue',
                width: 180,
                ellipsis: true,
                render: (value: unknown) =>
                  value === null || value === undefined ? '-' : String(value),
              },
            ]}
          />
        ) : (
          <Input.TextArea
            value={content}
            rows={16}
            className={styles.rowEditor}
            onChange={event => onChangeContent(event.target.value)}
          />
        )}
      </Space>
    </Modal>
  );
};

export default RowEditorModal;
