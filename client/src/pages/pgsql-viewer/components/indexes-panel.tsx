import React, { useMemo, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Table } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';

const INDEX_EDITOR_MODAL_WIDTH = 'var(--layout-modal-width-base)';

interface IndexInfo {
  name: string;
  definition: string;
}

interface IndexDraft {
  indexName: string;
  method: string;
  columns: string[];
  unique: boolean;
}

interface IndexesPanelProps {
  loading: boolean;
  indexes: IndexInfo[];
  columnOptions: Array<{
    label: string;
    value: string;
  }>;
  isMutating: boolean;
  onCreateIndex: (draft: IndexDraft) => Promise<void>;
  onUpdateIndex: (oldName: string, draft: IndexDraft) => Promise<void>;
  onDropIndex: (indexName: string) => Promise<void>;
}

const parseIndexDraft = (
  index: IndexInfo,
  columnOptions: Array<{
    label: string;
    value: string;
  }>,
): IndexDraft => {
  const columnOptionSet = new Set(columnOptions.map(option => option.value));
  const methodMatch = index.definition.match(/\bUSING\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const columnsMatch = index.definition.match(/\((.+)\)\s*$/);
  const parsedColumns = columnsMatch
    ? columnsMatch[1]
        .split(',')
        .map(segment => segment.trim())
        .map(segment => segment.replace(/"/g, '').split(/\s+/)[0]?.trim() || '')
        .filter(column => columnOptionSet.has(column))
    : [];

  return {
    indexName: index.name,
    method: methodMatch?.[1]?.toLowerCase() || 'btree',
    columns: parsedColumns,
    unique: /\bCREATE\s+UNIQUE\s+INDEX\b/i.test(index.definition),
  };
};

const IndexesPanel: React.FC<IndexesPanelProps> = ({
  loading,
  indexes,
  columnOptions,
  isMutating,
  onCreateIndex,
  onUpdateIndex,
  onDropIndex,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<IndexDraft>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IndexInfo | null>(null);

  const handleCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      indexName: '',
      method: 'btree',
      columns: [],
      unique: false,
    });
    setOpen(true);
  };

  const handleEdit = (index: IndexInfo) => {
    setEditing(index);
    form.setFieldsValue(parseIndexDraft(index, columnOptions));
    setOpen(true);
  };

  const handleSubmit = async () => {
    const draft = await form.validateFields();
    const normalizedDraft: IndexDraft = {
      ...draft,
      indexName: draft.indexName.trim(),
      method: draft.method.trim() || 'btree',
      columns: draft.columns,
      unique: !!draft.unique,
    };

    if (editing) {
      await onUpdateIndex(editing.name, normalizedDraft);
    } else {
      await onCreateIndex(normalizedDraft);
    }

    setOpen(false);
    setEditing(null);
  };

  const columns = useMemo(
    () => [
      {
        title: t('pgsql.indexName'),
        dataIndex: 'name',
        width: 260,
      },
      {
        title: t('table.statement'),
        dataIndex: 'definition',
      },
      {
        title: (
          <>
            {t('table.operation')}
            <Button
              className={styles.columnActionBtn}
              color="cyan"
              variant="link"
              onClick={handleCreate}
            >
              {t('button.add')}
            </Button>
          </>
        ),
        key: 'operation',
        width: 170,
        render: (_: unknown, row: IndexInfo) => (
          <>
            <Button
              className={styles.columnActionBtn}
              color="cyan"
              variant="link"
              onClick={() => handleEdit(row)}
            >
              {t('button.edit')}
            </Button>
            <Popconfirm
              title={t('delete.title')}
              description={t('delete.desc')}
              onConfirm={() => onDropIndex(row.name)}
            >
              <Button className={styles.columnActionBtn} color="danger" variant="link">
                {t('button.delete')}
              </Button>
            </Popconfirm>
          </>
        ),
      },
    ],
    [onDropIndex, t],
  );

  return (
    <div className={styles.wrapper}>
      <Table
        className={styles.dataTable}
        rowKey="name"
        loading={loading}
        dataSource={indexes}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        columns={columns}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('button.update') : t('button.add')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={INDEX_EDITOR_MODAL_WIDTH}
        confirmLoading={isMutating}
        destroyOnHidden={true}
      >
        <Form<IndexDraft>
          form={form}
          layout="vertical"
          initialValues={{
            indexName: '',
            method: 'btree',
            columns: [],
            unique: false,
          }}
        >
          <Form.Item label={t('pgsql.indexName')} name="indexName" rules={[{ required: true }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item label={t('pgsql.indexMethod')} name="method" rules={[{ required: true }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label={t('pgsql.indexColumns')}
            name="columns"
            rules={[{ required: true, type: 'array', min: 1 }]}
          >
            <Select mode="multiple" allowClear options={columnOptions} />
          </Form.Item>
          <Form.Item name="unique" valuePropName="checked">
            <Checkbox>{t('pgsql.uniqueIndex')}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndexesPanel;
