import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from './index.module.less';

type TEventStatus = 'ENABLED' | 'DISABLED';

type TFormValue = Omit<IEventItem, 'status'> & { status: boolean };

type TModalMode = 'create' | 'edit' | 'view';

interface IEventItem {
  name: string;
  schedule: string;
  status: TEventStatus;
  definer: string;
  definition: string;
  comment?: string;
}

const MysqlEvent: React.FC = () => {
  const [data, setData] = useState<IEventItem[]>([
    {
      name: 'daily_cleanup',
      schedule: 'EVERY 1 DAY STARTS CURRENT_TIMESTAMP',
      status: 'ENABLED',
      definer: 'root@%',
      definition:
        'BEGIN\n  -- 清理 7 天前的日志\n  DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);\nEND',
      comment: '定时清理历史日志',
    },
    {
      name: 'hourly_refresh_cache',
      schedule: 'EVERY 1 HOUR',
      status: 'DISABLED',
      definer: 'app@localhost',
      definition: 'BEGIN\n  CALL refresh_materialized_views();\nEND',
      comment: '刷新缓存视图',
    },
  ]);
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TModalMode>('create');
  const [editing, setEditing] = useState<IEventItem | null>(null);
  const [form] = Form.useForm<TFormValue>();

  const columns: TableColumnsType<IEventItem> = useMemo(
    () => [
      {
        title: '事件名',
        dataIndex: 'name',
        width: 180,
      },
      {
        title: '调度',
        dataIndex: 'schedule',
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: value => (
          <Tag color={value === 'ENABLED' ? 'success' : 'default'}>
            {value === 'ENABLED' ? '启用' : '禁用'}
          </Tag>
        ),
      },
      {
        title: '定义者',
        dataIndex: 'definer',
        width: 160,
      },
      {
        title: '备注',
        dataIndex: 'comment',
        ellipsis: true,
      },
      {
        title: t('table.operation'),
        key: 'action',
        width: 140,
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
    [],
  );

  const handleDelete = (name: string) => {
    setData(prev => prev.filter(item => item.name !== name));
    if (editing?.name === name) {
      setEditing(null);
      form.resetFields();
      setModalOpen(false);
    }
  };

  const handleEdit = (record: IEventItem) => {
    setModalMode('edit');
    setEditing(record);
    form.setFieldsValue({ ...record, status: record.status === 'ENABLED' });
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setModalMode('create');
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: true, definer: 'root@%' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (modalMode === 'view') {
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      return;
    }

    const values = await form.validateFields();
    const next: IEventItem = {
      ...values,
      status: values.status ? 'ENABLED' : 'DISABLED',
    } as IEventItem;

    if (modalMode === 'edit' && editing) {
      setData(prev => prev.map(item => (item.name === editing.name ? next : item)));
    } else {
      setData(prev => [next, ...prev]);
    }

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Card
        className={styles.card}
        title={t('mysql.event')}
        extra={
          <Button color="cyan" variant="link" onClick={handleCreateClick}>
            {t('button.add')}
          </Button>
        }
      >
        <Table<IEventItem>
          rowKey={record => record.name}
          columns={columns}
          dataSource={data}
          pagination={false}
          onRow={record => ({
            onDoubleClick: () => handleEdit(record),
          })}
        />
      </Card>

      <Modal
        title={modalMode === 'view' ? '查看事件' : modalMode === 'edit' ? '编辑事件' : '新建事件'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={handleSave}
        width={700}
      >
        <Form<TFormValue>
          layout="vertical"
          form={form}
          disabled={modalMode === 'view'}
          initialValues={{ status: true, definer: 'root@%' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="事件名" name="name" rules={[{ required: true }]}>
                <Input placeholder="例如 daily_cleanup" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="调度" name="schedule" rules={[{ required: true }]}>
                <Input placeholder="EVERY 1 DAY STARTS CURRENT_TIMESTAMP" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="状态" name="status" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="定义者" name="definer">
                <Input placeholder="root@%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="comment">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="定义（SQL）" name="definition" rules={[{ required: true }]}>
            <Input.TextArea
              placeholder={'BEGIN\n  -- your sql here\nEND'}
              autoSize={{ minRows: 4, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MysqlEvent;
