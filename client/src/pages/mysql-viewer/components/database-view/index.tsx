import React, { useMemo, useState } from 'react';
import { Button, Col, Form, Input, Modal, Popconfirm, Row, Select, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc, RouterInput, RouterOutput } from '@/utils/trpc';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { EMySQLViewCheckOption, EMysqlFunctionSecurity } from '@packages/types/mysql';
import styles from './index.module.less';

type TFormValue = Omit<RouterInput['mysql']['createView'], 'connectionId' | 'dbName'>;
type TViewItem = RouterOutput['mysql']['getViews'][number];

const MysqlView: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TViewItem | null>(null);
  const [form] = Form.useForm<TFormValue>();

  const getViewsQuery = useQuery(
    trpc.mysql.getViews.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createViewMutation = useMutation(
    trpc.mysql.createView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );

  const updateViewMutation = useMutation(
    trpc.mysql.updateView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );

  const deleteViewMutation = useMutation(
    trpc.mysql.deleteView.mutationOptions({
      onSuccess: () => getViewsQuery.refetch(),
    }),
  );

  const handleCreateClick = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      definer: 'root@%',
      checkOption: EMySQLViewCheckOption.CASCADED,
      security: EMysqlFunctionSecurity.DEFINER,
    });
    setModalOpen(true);
  };

  const columns: TableColumnsType<TViewItem> = useMemo(
    () => [
      {
        title: '视图名',
        dataIndex: 'name',
      },
      {
        title: '定义者',
        dataIndex: 'definer',
        width: 160,
      },
      {
        title: 'Check Option',
        dataIndex: 'checkOption',
        width: 160,
        render: value => <Tag color="processing">{value}</Tag>,
      },
      {
        title: 'Security',
        dataIndex: 'security',
        width: 140,
        render: value => (
          <Tag color={value === EMysqlFunctionSecurity.DEFINER ? 'success' : 'default'}>
            {value}
          </Tag>
        ),
      },
      {
        title: '备注',
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
    [t],
  );

  const handleDelete = async (name: string) => {
    await deleteViewMutation.mutateAsync({ connectionId, dbName, name });
    if (editing?.name === name) {
      setEditing(null);
      form.resetFields();
      setModalOpen(false);
    }
  };

  const handleEdit = (record: TViewItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload: RouterInput['mysql']['createView'] = {
      connectionId,
      dbName,
      ...values,
    };

    if (editing) {
      await updateViewMutation.mutateAsync({ ...payload, oldName: editing.name });
    } else {
      await createViewMutation.mutateAsync(payload);
    }

    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TViewItem>
        rowKey={record => record.name}
        columns={columns}
        dataSource={getViewsQuery.data}
        loading={getViewsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '200px' }}
      />

      <Modal
        title={editing ? '编辑视图' : '新建视图'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={handleSave}
        width={780}
        confirmLoading={
          createViewMutation.isPending ||
          updateViewMutation.isPending ||
          deleteViewMutation.isPending
        }
      >
        <Form<TFormValue>
          layout="vertical"
          form={form}
          initialValues={{
            definer: 'root@%',
            checkOption: EMySQLViewCheckOption.CASCADED,
            security: EMysqlFunctionSecurity.DEFINER,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="视图名" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="定义者" name="definer">
                <Input placeholder="root@%" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Check Option" name="checkOption">
                <Select
                  allowClear
                  options={Object.values(EMySQLViewCheckOption).map(value => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Security" name="security">
                <Select
                  allowClear
                  options={Object.values(EMysqlFunctionSecurity).map(value => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Algorithm" name="algorithm">
            <Input placeholder="UNDEFINED / MERGE / TEMPTABLE" />
          </Form.Item>

          <Form.Item label="备注" name="comment">
            <Input />
          </Form.Item>

          <Form.Item label="定义（SQL）" name="definition" rules={[{ required: true }]}>
            <Input.TextArea
              placeholder={'SELECT * FROM ...'}
              autoSize={{ minRows: 6, maxRows: 14 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MysqlView;
