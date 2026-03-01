import React, { useMemo, useState } from 'react';
import { Button, Col, Form, Input, Modal, Popconfirm, Row, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc, RouterInput, RouterOutput } from '@/utils/trpc';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { EMySQLEventStatus } from '@packages/types/mysql';
import styles from './index.module.less';

type TFormValue = Omit<
  RouterInput['mysql']['createEvent'],
  'connectionId' | 'dbName' | 'status'
> & {
  status: boolean;
};

type TEventItem = RouterOutput['mysql']['getEvents'][number];

const MysqlEvent: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TEventItem | null>(null);
  const [form] = Form.useForm<TFormValue>();

  const getEventsQuery = useQuery(
    trpc.mysql.getEvents.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createEventMutation = useMutation(
    trpc.mysql.createEvent.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );

  const updateEventMutation = useMutation(
    trpc.mysql.updateEvent.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );

  const deleteEventMutation = useMutation(
    trpc.mysql.deleteEvent.mutationOptions({
      onSuccess: () => getEventsQuery.refetch(),
    }),
  );

  const handleCreateClick = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: true,
      definer: 'root@%',
    });
    setModalOpen(true);
  };

  const columns: TableColumnsType<TEventItem> = useMemo(
    () => [
      {
        title: t('mysql.eventName'),
        dataIndex: 'name',
      },
      {
        title: t('mysql.eventSchedule'),
        dataIndex: 'schedule',
      },
      {
        title: t('mysql.eventStatus'),
        dataIndex: 'status',
        width: 120,
        render: value => (
          <Tag color={value === EMySQLEventStatus.ENABLED ? 'success' : 'default'}>{value}</Tag>
        ),
      },
      {
        title: t('mysql.viewDefiner'),
        dataIndex: 'definer',
        width: 160,
      },
      {
        title: t('table.comment'),
        dataIndex: 'comment',
        ellipsis: true,
      },
      {
        title: (
          <>
            {t('table.operation')}
            <Button color="cyan" variant="link" onClick={handleCreateClick}>
              {t('button.add')}
            </Button>
          </>
        ),
        key: 'action',
        width: 170,
        render: (_: unknown, record) => (
          <>
            <Button
              className={styles.columnActionBtn}
              color="cyan"
              variant="link"
              onClick={() => handleEdit(record)}
            >
              {t('button.edit')}
            </Button>
            <Popconfirm
              title={t('delete.title')}
              description={t('delete.desc')}
              onConfirm={() => handleDelete(record.name)}
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

  const handleDelete = async (name: string) => {
    await deleteEventMutation.mutateAsync({ connectionId, dbName, name });
    if (editing?.name === name) {
      setEditing(null);
      form.resetFields();
      setModalOpen(false);
    }
  };

  const handleEdit = (record: TEventItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      status: record.status !== EMySQLEventStatus.DISABLED,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload: RouterInput['mysql']['createEvent'] = {
      connectionId,
      dbName,
      ...values,
      status: values.status ? EMySQLEventStatus.ENABLED : EMySQLEventStatus.DISABLED,
    };

    if (editing) {
      await updateEventMutation.mutateAsync({ ...payload, oldName: editing.name });
    } else {
      await createEventMutation.mutateAsync(payload);
    }

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TEventItem>
        rowKey={record => record.name}
        columns={columns}
        dataSource={getEventsQuery.data}
        loading={getEventsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: 'calc(100vh - 195px)' }}
      />

      <Modal
        title={editing ? t('mysql.editEvent') : t('mysql.createEvent')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={handleSave}
        width={780}
        confirmLoading={
          createEventMutation.isPending ||
          updateEventMutation.isPending ||
          deleteEventMutation.isPending
        }
      >
        <Form<TFormValue>
          layout="vertical"
          form={form}
          initialValues={{ status: true, definer: 'root@%' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('mysql.eventName')} name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('mysql.eventEnabled')} name="status" valuePropName="checked">
                <Switch checkedChildren="YES" unCheckedChildren="NO" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('mysql.eventSchedule')} name="schedule" rules={[{ required: true }]}>
            <Input.TextArea
              placeholder={'EVERY 1 DAY STARTS CURRENT_TIMESTAMP'}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item label={t('mysql.viewDefiner')} name="definer">
            <Input placeholder="root@%" />
          </Form.Item>

          <Form.Item
            label={t('mysql.viewDefinitionSql')}
            name="definition"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              placeholder={'BEGIN\n  -- your sql here\n  CALL your_procedure();\nEND'}
              autoSize={{ minRows: 6, maxRows: 14 }}
            />
          </Form.Item>

          <Form.Item label={t('table.comment')} name="comment">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MysqlEvent;
