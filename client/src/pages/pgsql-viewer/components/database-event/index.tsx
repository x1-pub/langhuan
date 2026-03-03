import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { trpc, RouterOutput } from '@/infra/api/trpc';
import styles from '../../index.module.less';

const EVENT_MODAL_WIDTH = 'var(--layout-modal-width-xl)';

type TPgsqlEventTrigger = RouterOutput['pgsql']['getEventTriggers'][number];

interface IEventForm {
  definition: string;
}

const getEventTriggerTemplate = () => {
  return [
    'CREATE EVENT TRIGGER trg_demo_ddl',
    'ON ddl_command_end',
    "WHEN TAG IN ('CREATE TABLE')",
    'EXECUTE FUNCTION public.fn_handle_ddl();',
  ].join('\n');
};

const DatabaseEvent: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const [form] = Form.useForm<IEventForm>();
  const [editing, setEditing] = useState<TPgsqlEventTrigger | null>(null);
  const [open, setOpen] = useState(false);

  const getEventsQuery = useQuery(
    trpc.pgsql.getEventTriggers.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createMutation = useMutation(
    trpc.pgsql.createEventTrigger.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );
  const updateMutation = useMutation(
    trpc.pgsql.updateEventTrigger.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );
  const deleteMutation = useMutation(
    trpc.pgsql.deleteEventTrigger.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );

  const columns: TableColumnsType<TPgsqlEventTrigger> = useMemo(
    () => [
      {
        title: t('table.name'),
        dataIndex: 'name',
        key: 'name',
        width: 260,
      },
      {
        title: t('table.event'),
        dataIndex: 'event',
        key: 'event',
        width: 200,
        render: value => <Tag color="processing">{String(value || '-')}</Tag>,
      },
      {
        title: t('pgsql.triggerStatus'),
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: value => (
          <Tag color={value === 'ENABLED' ? 'success' : 'default'}>{String(value || '-')}</Tag>
        ),
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
      definition: getEventTriggerTemplate(),
    });
    setOpen(true);
  }

  function handleEdit(record: TPgsqlEventTrigger) {
    setEditing(record);
    form.setFieldsValue({
      definition: String(record.definition || ''),
    });
    setOpen(true);
  }

  async function handleDelete(record: TPgsqlEventTrigger) {
    await deleteMutation.mutateAsync({
      connectionId,
      dbName,
      name: String(record.name),
    });
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({
        connectionId,
        dbName,
        oldName: String(editing.name),
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
      <Table<TPgsqlEventTrigger>
        className={styles.dataTable}
        rowKey={row => String(row.name)}
        loading={getEventsQuery.isLoading}
        columns={columns}
        dataSource={getEventsQuery.data || []}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('pgsql.editEvent') : t('pgsql.createEvent')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={EVENT_MODAL_WIDTH}
        confirmLoading={loading}
        destroyOnHidden={true}
      >
        <Form<IEventForm> layout="vertical" form={form}>
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

export default DatabaseEvent;
