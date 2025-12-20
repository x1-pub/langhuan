import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

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
        title: '操作',
        width: 200,
        render: (_, record) => (
          <Space size="small">
            <Button
              className={styles.columnActionBtn}
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              查看
            </Button>
            <Button
              className={styles.columnActionBtn}
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除?"
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(record.name)}
            >
              <Button
                className={styles.columnActionBtn}
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
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

  const handleView = (record: IEventItem) => {
    setModalMode('view');
    setEditing(record);
    form.setFieldsValue({ ...record, status: record.status === 'ENABLED' });
    setModalOpen(true);
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
        title="事件管理"
        extra={
          <Button color="cyan" variant="link" icon={<PlusOutlined />} onClick={handleCreateClick}>
            新增
          </Button>
        }
      >
        <Table<IEventItem>
          rowKey={record => record.name}
          columns={columns}
          dataSource={data}
          pagination={false}
          size="middle"
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
        okText={modalMode === 'view' ? '关闭' : '保存'}
      >
        <Form<TFormValue>
          layout="vertical"
          form={form}
          disabled={modalMode === 'view'}
          initialValues={{ status: true, definer: 'root@%' }}
        >
          <Form.Item
            label="事件名"
            name="name"
            rules={[{ required: true, message: '请输入事件名' }]}
          >
            <Input placeholder="例如 daily_cleanup" />
          </Form.Item>
          <Form.Item
            label="调度"
            name="schedule"
            rules={[{ required: true, message: '请输入调度表达式' }]}
          >
            <Input placeholder="EVERY 1 DAY STARTS CURRENT_TIMESTAMP" />
          </Form.Item>
          <Form.Item label="定义者" name="definer">
            <Input placeholder="root@%" />
          </Form.Item>
          <Form.Item label="状态" name="status" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item label="备注" name="comment">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item
            label="定义（SQL）"
            name="definition"
            rules={[{ required: true, message: '请输入事件定义' }]}
          >
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
