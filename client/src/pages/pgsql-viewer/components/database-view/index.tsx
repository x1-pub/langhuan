import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { trpc, RouterOutput } from '@/infra/api/trpc';
import styles from '../../index.module.less';

const VIEW_MODAL_WIDTH = 'var(--layout-modal-width-xl)';

type TPgsqlView = RouterOutput['pgsql']['getViews'][number];

interface IViewForm {
  schemaName: string;
  name: string;
  definition: string;
  comment?: string;
}

const getViewTemplate = () => {
  return ['SELECT', '  now() AS current_time;'].join('\n');
};

const DatabaseView: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const [form] = Form.useForm<IViewForm>();
  const [editing, setEditing] = useState<TPgsqlView | null>(null);
  const [open, setOpen] = useState(false);

  const getViewsQuery = useQuery(
    trpc.pgsql.getViews.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createMutation = useMutation(
    trpc.pgsql.createView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );
  const updateMutation = useMutation(
    trpc.pgsql.updateView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );
  const deleteMutation = useMutation(
    trpc.pgsql.deleteView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );

  const columns: TableColumnsType<TPgsqlView> = useMemo(
    () => [
      {
        title: t('table.name'),
        key: 'name',
        width: 320,
        render: (_, row) => `${row.schema}.${row.name}`,
      },
      {
        title: t('table.comment'),
        dataIndex: 'comment',
        key: 'comment',
        ellipsis: true,
        render: value => (value ? String(value) : '-'),
      },
      {
        title: (
          <>
            {t('table.operation')}
            <Button color="cyan" variant="link" onClick={handleCreate}>
              {t('button.add')}
            </Button>
          </>
        ),
        key: 'action',
        width: 170,
        render: (_, row) => (
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
              onConfirm={() => handleDelete(row)}
            >
              <Button className={styles.columnActionBtn} color="danger" variant="link">
                {t('button.delete')}
              </Button>
            </Popconfirm>
          </>
        ),
      },
    ],
    [t],
  );

  function handleCreate() {
    setEditing(null);
    form.setFieldsValue({
      schemaName: 'public',
      name: '',
      definition: getViewTemplate(),
      comment: '',
    });
    setOpen(true);
  }

  function handleEdit(record: TPgsqlView) {
    setEditing(record);
    form.setFieldsValue({
      schemaName: String(record.schema || 'public'),
      name: String(record.name || ''),
      definition: String(record.definition || ''),
      comment: String(record.comment || ''),
    });
    setOpen(true);
  }

  async function handleDelete(record: TPgsqlView) {
    await deleteMutation.mutateAsync({
      connectionId,
      dbName,
      schemaName: String(record.schema),
      name: String(record.name),
    });
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({
        connectionId,
        dbName,
        oldSchemaName: String(editing.schema),
        oldName: String(editing.name),
        schemaName: values.schemaName,
        name: values.name,
        definition: values.definition,
        comment: values.comment,
      });
    } else {
      await createMutation.mutateAsync({
        connectionId,
        dbName,
        schemaName: values.schemaName,
        name: values.name,
        definition: values.definition,
        comment: values.comment,
      });
    }

    setOpen(false);
    setEditing(null);
  }

  const loading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className={styles.wrapper}>
      <Table<TPgsqlView>
        className={styles.dataTable}
        rowKey={row => `${row.schema}.${row.name}`}
        loading={getViewsQuery.isLoading}
        columns={columns}
        dataSource={getViewsQuery.data || []}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('pgsql.editView') : t('pgsql.createView')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={VIEW_MODAL_WIDTH}
        confirmLoading={loading}
        destroyOnHidden={true}
      >
        <Form<IViewForm> layout="vertical" form={form}>
          <Form.Item label={t('pgsql.schemaName')} name="schemaName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('table.name')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('pgsql.definitionSql')}
            name="definition"
            rules={[{ required: true }]}
          >
            <Input.TextArea autoSize={{ minRows: 8, maxRows: 18 }} />
          </Form.Item>
          <Form.Item label={t('table.comment')} name="comment">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DatabaseView;
