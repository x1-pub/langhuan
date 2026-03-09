import React from 'react';
import { Col, Form, Input, Modal, Row, Select, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc, RouterInput, RouterOutput } from '@/infra/api/trpc';
import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { EMySQLViewCheckOption, EMysqlFunctionSecurity } from '@packages/types/mysql';
import useNamedEntityModal from '../shared/use-named-entity-modal';
import { CrudActionButtons, CrudActionColumnTitle } from '../shared/crud-action-column';
import styles from './index.module.less';

const VIEW_MODAL_WIDTH = 'var(--layout-modal-width-base)';

type TFormValue = Omit<RouterInput['mysql']['createView'], 'connectionId' | 'dbName'>;
type TViewItem = RouterOutput['mysql']['getViews'][number];

const MysqlView: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName } = useDatabaseWindows();
  const {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  } = useNamedEntityModal<TViewItem>();
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
    openCreateModal();
    form.resetFields();
    form.setFieldsValue({
      definer: 'root@%',
      checkOption: EMySQLViewCheckOption.CASCADED,
      security: EMysqlFunctionSecurity.DEFINER,
    });
  };

  const columns: TableColumnsType<TViewItem> = [
    {
      title: t('mysql.viewName'),
      dataIndex: 'name',
    },
    {
      title: t('mysql.viewDefiner'),
      dataIndex: 'definer',
      width: 160,
    },
    {
      title: t('mysql.viewCheckOption'),
      dataIndex: 'checkOption',
      width: 160,
      render: value => <Tag color="processing">{value}</Tag>,
    },
    {
      title: t('mysql.viewSecurity'),
      dataIndex: 'security',
      width: 140,
      render: value => (
        <Tag color={value === EMysqlFunctionSecurity.DEFINER ? 'success' : 'default'}>{value}</Tag>
      ),
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
    await deleteViewMutation.mutateAsync({ connectionId, dbName, name });
    closeIfEditingTarget(name);
    form.resetFields();
  };

  const handleEdit = (record: TViewItem) => {
    openEditModal(record);
    form.setFieldsValue(record);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload: RouterInput['mysql']['createView'] = {
      connectionId,
      dbName,
      ...values,
    };

    if (editingEntity) {
      await updateViewMutation.mutateAsync({ ...payload, oldName: editingEntity.name });
    } else {
      await createViewMutation.mutateAsync(payload);
    }

    closeModal();
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TViewItem>
        className={styles.dataTable}
        rowKey={record => record.name}
        columns={columns}
        dataSource={getViewsQuery.data}
        loading={getViewsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '100%' }}
      />

      <Modal
        title={editingEntity ? t('mysql.editView') : t('mysql.createView')}
        open={modalOpen}
        onCancel={() => {
          closeModal();
          form.resetFields();
        }}
        onOk={handleSave}
        width={VIEW_MODAL_WIDTH}
        confirmLoading={createViewMutation.isPending || updateViewMutation.isPending}
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
              <Form.Item label={t('mysql.viewName')} name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('mysql.viewDefiner')} name="definer">
                <Input placeholder="root@%" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('mysql.viewCheckOption')} name="checkOption">
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
              <Form.Item label={t('mysql.viewSecurity')} name="security">
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

          <Form.Item label={t('mysql.viewAlgorithm')} name="algorithm">
            <Input placeholder="UNDEFINED / MERGE / TEMPTABLE" />
          </Form.Item>

          <Form.Item label={t('table.comment')} name="comment">
            <Input />
          </Form.Item>

          <Form.Item
            label={t('mysql.viewDefinitionSql')}
            name="definition"
            rules={[{ required: true }]}
          >
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
