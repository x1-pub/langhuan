import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import styles from './index.module.less';

type TCheckOption = 'CASCADED' | 'LOCAL';
type TSecurity = 'DEFINER' | 'INVOKER';

type TModalMode = 'create' | 'edit' | 'view';

type TFormValue = IViewItem;

interface IViewItem {
  name: string;
  definer: string;
  checkOption: TCheckOption;
  security: TSecurity;
  algorithm?: string;
  definition: string;
  comment?: string;
}

const MysqlView: React.FC = () => {
  const [data, setData] = useState<IViewItem[]>([
    {
      name: 'active_users',
      definer: 'root@%',
      checkOption: 'CASCADED',
      security: 'DEFINER',
      algorithm: 'UNDEFINED',
      definition: 'SELECT id, username, last_login FROM users WHERE status = "active"',
      comment: '当前活跃用户',
    },
    {
      name: 'order_summary',
      definer: 'app@localhost',
      checkOption: 'LOCAL',
      security: 'INVOKER',
      algorithm: 'MERGE',
      definition:
        'SELECT user_id, COUNT(*) as total_orders, SUM(amount) as total_amount FROM orders GROUP BY user_id',
      comment: '订单汇总视图',
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TModalMode>('create');
  const [editing, setEditing] = useState<IViewItem | null>(null);
  const [form] = Form.useForm<TFormValue>();

  const columns: TableColumnsType<IViewItem> = useMemo(
    () => [
      {
        title: '视图名',
        dataIndex: 'name',
        width: 180,
      },
      {
        title: '定义者',
        dataIndex: 'definer',
        width: 160,
      },
      {
        title: 'Check Option',
        dataIndex: 'checkOption',
        width: 140,
        render: value => <Tag color="processing">{value}</Tag>,
      },
      {
        title: 'Security',
        dataIndex: 'security',
        width: 140,
        render: value => <Tag color={value === 'DEFINER' ? 'success' : 'default'}>{value}</Tag>,
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

  const handleView = (record: IViewItem) => {
    setModalMode('view');
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleEdit = (record: IViewItem) => {
    setModalMode('edit');
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setModalMode('create');
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ checkOption: 'CASCADED', security: 'DEFINER', definer: 'root@%' });
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

    if (modalMode === 'edit' && editing) {
      setData(prev => prev.map(item => (item.name === editing.name ? values : item)));
    } else {
      setData(prev => [values, ...prev]);
    }

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Card
        className={styles.card}
        title="视图管理"
        extra={
          <Button color="cyan" variant="link" icon={<PlusOutlined />} onClick={handleCreateClick}>
            新增
          </Button>
        }
      >
        <Table<IViewItem>
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
        title={modalMode === 'view' ? '查看视图' : modalMode === 'edit' ? '编辑视图' : '新建视图'}
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
          initialValues={{ checkOption: 'CASCADED', security: 'DEFINER', definer: 'root@%' }}
        >
          <Form.Item
            label="视图名"
            name="name"
            rules={[{ required: true, message: '请输入视图名' }]}
          >
            <Input placeholder="例如 active_users" />
          </Form.Item>
          <Form.Item label="定义者" name="definer">
            <Input placeholder="root@%" />
          </Form.Item>
          <Form.Item label="Check Option" name="checkOption" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'CASCADED', label: 'CASCADED' },
                { value: 'LOCAL', label: 'LOCAL' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Security" name="security" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'DEFINER', label: 'DEFINER' },
                { value: 'INVOKER', label: 'INVOKER' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Algorithm" name="algorithm">
            <Input placeholder="UNDEFINED / MERGE / TEMPTABLE" />
          </Form.Item>
          <Form.Item label="备注" name="comment">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item
            label="定义（SQL）"
            name="definition"
            rules={[{ required: true, message: '请输入视图定义' }]}
          >
            <Input.TextArea
              placeholder={'SELECT * FROM ...'}
              autoSize={{ minRows: 4, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MysqlView;
