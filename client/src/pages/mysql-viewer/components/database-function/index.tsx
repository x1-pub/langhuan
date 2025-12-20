import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import styles from './index.module.less';

interface IFunctionItem {
  name: string;
  returns: string;
  deterministic: boolean;
  definer: string;
  definition: string;
  comment?: string;
}

type TModalMode = 'create' | 'edit' | 'view';

type TFormValue = IFunctionItem;

const MysqlFunction: React.FC = () => {
  const [data, setData] = useState<IFunctionItem[]>([
    {
      name: 'add_tax',
      returns: 'DECIMAL(10,2)',
      deterministic: true,
      definer: 'root@%',
      definition:
        'BEGIN\n  DECLARE result DECIMAL(10,2);\n  SET result = amount * 1.06;\n  RETURN result;\nEND',
      comment: '税额计算函数',
    },
    {
      name: 'uuid_short_str',
      returns: 'VARCHAR(32)',
      deterministic: false,
      definer: 'app@localhost',
      definition: 'BEGIN\n  RETURN REPLACE(UUID(), "-", "");\nEND',
      comment: '生成 uuid 字符串',
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TModalMode>('create');
  const [editing, setEditing] = useState<IFunctionItem | null>(null);
  const [form] = Form.useForm<TFormValue>();

  const columns: TableColumnsType<IFunctionItem> = useMemo(
    () => [
      {
        title: '函数名',
        dataIndex: 'name',
        width: 180,
      },
      {
        title: '返回类型',
        dataIndex: 'returns',
        width: 160,
      },
      {
        title: '确定性',
        dataIndex: 'deterministic',
        width: 120,
        render: value => (
          <Tag color={value ? 'success' : 'default'}>
            {value ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
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

  const handleView = (record: IFunctionItem) => {
    setModalMode('view');
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleEdit = (record: IFunctionItem) => {
    setModalMode('edit');
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setModalMode('create');
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ deterministic: true, definer: 'root@%' } as TFormValue);
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
        title="函数管理"
        extra={
          <Button color="cyan" variant="link" icon={<PlusOutlined />} onClick={handleCreateClick}>
            新增
          </Button>
        }
      >
        <Table<IFunctionItem>
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
        title={modalMode === 'view' ? '查看函数' : modalMode === 'edit' ? '编辑函数' : '新建函数'}
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
          initialValues={{ deterministic: true, definer: 'root@%' }}
        >
          <Form.Item
            label="函数名"
            name="name"
            rules={[{ required: true, message: '请输入函数名' }]}
          >
            <Input placeholder="例如 add_tax" />
          </Form.Item>
          <Form.Item
            label="返回类型"
            name="returns"
            rules={[{ required: true, message: '请输入返回类型' }]}
          >
            <Input placeholder="DECIMAL(10,2)" />
          </Form.Item>
          <Form.Item label="定义者" name="definer">
            <Input placeholder="root@%" />
          </Form.Item>
          <Form.Item label="确定性" name="deterministic" valuePropName="checked">
            <Switch checkedChildren="DETERMINISTIC" unCheckedChildren="NOT" />
          </Form.Item>
          <Form.Item label="备注" name="comment">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item
            label="定义（SQL）"
            name="definition"
            rules={[{ required: true, message: '请输入函数定义' }]}
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

export default MysqlFunction;
