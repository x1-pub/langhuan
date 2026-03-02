import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { trpc, RouterOutput } from '@/infra/api/trpc';
import styles from '../../index.module.less';

const FUNCTION_MODAL_WIDTH = 'var(--layout-modal-width-xl)';

type TPgsqlFunction = RouterOutput['pgsql']['getFunctions'][number];

interface IEditorForm {
  definition: string;
}

const getFunctionTemplate = () => {
  return [
    'CREATE OR REPLACE FUNCTION public.fn_demo(value_text text)',
    'RETURNS text',
    'LANGUAGE plpgsql',
    'AS $$',
    'BEGIN',
    "  RETURN value_text || '_ok';",
    'END;',
    '$$;',
  ].join('\n');
};

const DatabaseFunction: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const [form] = Form.useForm<IEditorForm>();
  const [editing, setEditing] = useState<TPgsqlFunction | null>(null);
  const [open, setOpen] = useState(false);

  const getFunctionsQuery = useQuery(
    trpc.pgsql.getFunctions.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createMutation = useMutation(
    trpc.pgsql.createFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );
  const updateMutation = useMutation(
    trpc.pgsql.updateFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );
  const deleteMutation = useMutation(
    trpc.pgsql.deleteFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );

  const columns: TableColumnsType<TPgsqlFunction> = useMemo(
    () => [
      {
        title: t('table.name'),
        key: 'name',
        width: 320,
        render: (_, row) => `${row.schema}.${row.name}`,
      },
      {
        title: t('pgsql.functionKind'),
        dataIndex: 'kind',
        key: 'kind',
        width: 120,
        render: value => <Tag color="processing">{String(value || '-')}</Tag>,
      },
      {
        title: t('pgsql.functionArguments'),
        dataIndex: 'arguments',
        key: 'arguments',
        width: 240,
        ellipsis: true,
        render: value => (value ? String(value) : '-'),
      },
      {
        title: t('pgsql.functionReturns'),
        dataIndex: 'returns',
        key: 'returns',
        width: 200,
        ellipsis: true,
        render: value => (value ? String(value) : '-'),
      },
      {
        title: t('pgsql.functionLanguage'),
        dataIndex: 'language',
        key: 'language',
        width: 120,
        render: value => <Tag>{String(value || '-')}</Tag>,
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
      definition: getFunctionTemplate(),
    });
    setOpen(true);
  }

  function handleEdit(record: TPgsqlFunction) {
    setEditing(record);
    form.setFieldsValue({
      definition: String(record.definition || ''),
    });
    setOpen(true);
  }

  async function handleDelete(record: TPgsqlFunction) {
    await deleteMutation.mutateAsync({
      connectionId,
      dbName,
      schemaName: String(record.schema),
      name: String(record.name),
      arguments: String(record.arguments || ''),
      kind: String(record.kind || ''),
    });
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({
        connectionId,
        dbName,
        definition: values.definition,
      });
    } else {
      await createMutation.mutateAsync({
        connectionId,
        dbName,
        definition: values.definition,
      });
    }

    setOpen(false);
    setEditing(null);
  }

  const loading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className={styles.wrapper}>
      <Table<TPgsqlFunction>
        className={styles.dataTable}
        rowKey={row => `${row.schema}.${row.name}(${row.arguments || ''})`}
        loading={getFunctionsQuery.isLoading}
        columns={columns}
        dataSource={getFunctionsQuery.data || []}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('pgsql.editFunction') : t('pgsql.createFunction')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={FUNCTION_MODAL_WIDTH}
        confirmLoading={loading}
        destroyOnHidden={true}
      >
        <Form<IEditorForm> layout="vertical" form={form}>
          <Form.Item
            label={t('pgsql.definitionSql')}
            name="definition"
            rules={[{ required: true }]}
          >
            <Input.TextArea autoSize={{ minRows: 10, maxRows: 22 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DatabaseFunction;
