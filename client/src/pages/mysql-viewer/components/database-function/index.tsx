import React from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Switch, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc, RouterInput, RouterOutput } from '@/infra/api/trpc';
import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { EMysqlFunctionDataAccess, EMysqlFunctionSecurity } from '@packages/types/mysql';
import MySQLColumnTypeSelector from '@/components/mysql-column-type-selector';
import useNamedEntityModal from '../shared/use-named-entity-modal';
import { CrudActionButtons, CrudActionColumnTitle } from '../shared/crud-action-column';
import styles from './index.module.less';

const FUNCTION_MODAL_WIDTH = 'var(--layout-modal-width-base)';

type TFormValue = Omit<RouterInput['mysql']['createFunction'], 'connectionId' | 'dbName'>;
type TFunctionItem = RouterOutput['mysql']['getFunctions'][number];

const MysqlFunction: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  } = useNamedEntityModal<TFunctionItem>();
  const [form] = Form.useForm<TFormValue>();

  const getFunctionsQuery = useQuery(
    trpc.mysql.getFunctions.queryOptions({
      connectionId,
      dbName,
    }),
  );

  const createFunctionMutation = useMutation(
    trpc.mysql.createFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );

  const updateFunctionMutation = useMutation(
    trpc.mysql.updateFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );

  const deleteFunctionMutation = useMutation(
    trpc.mysql.deleteFunction.mutationOptions({
      onSuccess: () => getFunctionsQuery.refetch(),
    }),
  );

  const handleCreateClick = () => {
    openCreateModal();
    form.resetFields();
    form.setFieldsValue({
      deterministic: true,
      params: [],
    });
  };

  const columns: TableColumnsType<TFunctionItem> = [
    {
      title: t('mysql.functionName'),
      dataIndex: 'name',
    },
    {
      title: t('mysql.functionReturns'),
      dataIndex: 'returns',
    },
    {
      title: t('mysql.functionDeterministic'),
      dataIndex: 'deterministic',
      width: 140,
      render: value => (
        <Tag color={value === false ? 'default' : 'success'}>{value === false ? 'NO' : 'YES'}</Tag>
      ),
    },
    {
      title: t('mysql.functionSqlDataAccess'),
      dataIndex: 'sqlDataAccess',
    },
    {
      title: t('mysql.functionSecurity'),
      dataIndex: 'security',
    },
    {
      title: t('table.comment'),
      dataIndex: 'comment',
      width: 220,
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
    await deleteFunctionMutation.mutateAsync({ connectionId, dbName, name });
    closeIfEditingTarget(name);
    form.resetFields();
  };

  const handleEdit = (record: TFunctionItem) => {
    openEditModal(record);
    form.setFieldsValue({
      ...record,
      deterministic: record.deterministic !== false,
    });
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      connectionId,
      dbName,
      ...values,
      deterministic: values.deterministic !== false,
    };

    if (editingEntity) {
      await updateFunctionMutation.mutateAsync({ ...payload, oldName: editingEntity.name });
    } else {
      await createFunctionMutation.mutateAsync(payload);
    }

    closeModal();
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TFunctionItem>
        className={styles.dataTable}
        rowKey={record => record.name}
        columns={columns}
        dataSource={getFunctionsQuery.data}
        loading={getFunctionsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '100%' }}
      />

      <Modal
        title={editingEntity ? t('mysql.editFunction') : t('mysql.createFunction')}
        open={modalOpen}
        onCancel={() => {
          closeModal();
          form.resetFields();
        }}
        onOk={handleSave}
        width={FUNCTION_MODAL_WIDTH}
        confirmLoading={createFunctionMutation.isPending || updateFunctionMutation.isPending}
      >
        <Form<TFormValue> layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('mysql.functionName')} name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('mysql.functionHasDeterministic')}
                name="deterministic"
                valuePropName="checked"
              >
                <Switch checkedChildren="YES" unCheckedChildren="NO" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('mysql.functionReturns')} name="returns" rules={[{ required: true }]}>
            <MySQLColumnTypeSelector />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('mysql.functionSecurity')} name="security">
                <Select
                  allowClear
                  options={Object.values(EMysqlFunctionSecurity).map(o => ({
                    label: o.toLocaleUpperCase(),
                    value: o.toLocaleUpperCase(),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('mysql.functionSqlDataAccess')} name="sqlDataAccess">
                <Select
                  allowClear
                  options={Object.values(EMysqlFunctionDataAccess).map(o => ({
                    label: o.toLocaleUpperCase(),
                    value: o.toLocaleUpperCase(),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="params">
            {(fields, { add, remove }) => (
              <Card
                size="small"
                title={t('mysql.functionParameters')}
                style={{ marginBottom: 12 }}
                extra={
                  <Button color="cyan" variant="link" onClick={() => add()}>
                    {t('mysql.functionAddParameter')}
                  </Button>
                }
              >
                {fields.length === 0 && (
                  <div style={{ color: '#888' }}>{t('mysql.functionNoParameterTip')}</div>
                )}
                {fields.map(field => (
                  <Row gutter={12} key={field.key}>
                    <Col span={10}>
                      <Form.Item
                        {...field}
                        label={t('table.name')}
                        name={[field.name, 'name']}
                        rules={[{ required: true }]}
                        key={field.key}
                      >
                        <Input placeholder="arg1" />
                      </Form.Item>
                    </Col>
                    <Col span={11}>
                      <Form.Item
                        {...field}
                        label={t('table.type')}
                        name={[field.name, 'type']}
                        rules={[{ required: true }]}
                        key={field.key}
                      >
                        <MySQLColumnTypeSelector />
                      </Form.Item>
                    </Col>
                    <Col span={3} style={{ display: 'flex', alignItems: 'center' }}>
                      <Button danger type="link" onClick={() => remove(field.name)}>
                        {t('button.delete')}
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Card>
            )}
          </Form.List>

          <Form.Item
            label={t('mysql.functionBody')}
            name="body"
            rules={[{ required: true, message: t('mysql.functionBodyRequired') }]}
          >
            <Input.TextArea
              placeholder={'BEGIN\n  -- your sql here\n  RETURN 0;\nEND'}
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

export default MysqlFunction;
