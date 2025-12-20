import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        title={t('mysql.function')}
        extra={
          <Button color="cyan" variant="link" onClick={handleCreateClick}>
            {t('button.add')}
          </Button>
        }
      >
        <Table<IFunctionItem>
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
        title={modalMode === 'view' ? '查看函数' : modalMode === 'edit' ? '编辑函数' : '新建函数'}
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
          initialValues={{ deterministic: true, definer: 'root@%' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="函数名" name="name" rules={[{ required: true }]}>
                <Input placeholder="例如 add_tax" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="返回类型" name="returns" rules={[{ required: true }]}>
                <Input placeholder="DECIMAL(10,2)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="确定性" name="deterministic" valuePropName="checked">
                <Switch checkedChildren="DETERMINISTIC" unCheckedChildren="NOT" />
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

export default MysqlFunction;
