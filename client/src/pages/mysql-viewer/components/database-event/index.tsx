import React from 'react';
import { Col, Form, Input, Modal, Row, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc, RouterInput, RouterOutput } from '@/infra/api/trpc';
import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { EMySQLEventStatus } from '@packages/types/mysql';
import useNamedEntityModal from '../shared/use-named-entity-modal';
import { CrudActionButtons, CrudActionColumnTitle } from '../shared/crud-action-column';
import styles from './index.module.less';

const EVENT_MODAL_WIDTH = 'var(--layout-modal-width-base)';

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
  const {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  } = useNamedEntityModal<TEventItem>();
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
    openCreateModal();
    form.resetFields();
    form.setFieldsValue({
      status: true,
      definer: 'root@%',
    });
  };

  const columns: TableColumnsType<TEventItem> = [
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
      title: <CrudActionColumnTitle onAdd={handleCreateClick} />,
      key: 'action',
      width: 170,
      render: (_: unknown, record) => (
        <CrudActionButtons
          className={styles.columnActionBtn}
          onEdit={() => handleEdit(record)}
          onDelete={() => handleDelete(record.name)}
        />
      ),
    },
  ];

  const handleDelete = async (name: string) => {
    await deleteEventMutation.mutateAsync({ connectionId, dbName, name });
    closeIfEditingTarget(name);
    form.resetFields();
  };

  const handleEdit = (record: TEventItem) => {
    openEditModal(record);
    form.setFieldsValue({
      ...record,
      status: record.status !== EMySQLEventStatus.DISABLED,
    });
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload: RouterInput['mysql']['createEvent'] = {
      connectionId,
      dbName,
      ...values,
      status: values.status ? EMySQLEventStatus.ENABLED : EMySQLEventStatus.DISABLED,
    };

    if (editingEntity) {
      await updateEventMutation.mutateAsync({ ...payload, oldName: editingEntity.name });
    } else {
      await createEventMutation.mutateAsync(payload);
    }

    closeModal();
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TEventItem>
        className={styles.dataTable}
        rowKey={record => record.name}
        columns={columns}
        dataSource={getEventsQuery.data}
        loading={getEventsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '100%' }}
      />

      <Modal
        title={editingEntity ? t('mysql.editEvent') : t('mysql.createEvent')}
        open={modalOpen}
        onCancel={() => {
          closeModal();
          form.resetFields();
        }}
        onOk={handleSave}
        width={EVENT_MODAL_WIDTH}
        confirmLoading={createEventMutation.isPending || updateEventMutation.isPending}
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
