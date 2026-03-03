import React, { useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Switch, Table } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';

const COLUMN_EDITOR_MODAL_WIDTH = 'var(--layout-modal-width-base)';

interface StructureColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
}

interface ColumnEditorFormValue {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  comment?: string;
}

interface StructurePanelProps {
  loading: boolean;
  columns: StructureColumn[];
  isMutating: boolean;
  onCreateColumn: (value: ColumnEditorFormValue) => Promise<void>;
  onUpdateColumn: (oldName: string, value: ColumnEditorFormValue) => Promise<void>;
  onDeleteColumn: (name: string) => Promise<void>;
}

const StructurePanel: React.FC<StructurePanelProps> = ({
  loading,
  columns,
  isMutating,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ColumnEditorFormValue>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StructureColumn | null>(null);

  const handleCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      name: '',
      dataType: 'text',
      nullable: true,
      defaultValue: '',
      comment: '',
    });
    setOpen(true);
  };

  const handleEdit = (record: StructureColumn) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      dataType: record.dataType,
      nullable: record.nullable,
      defaultValue: record.defaultValue || '',
      comment: record.comment || '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const value = await form.validateFields();

    if (editing) {
      await onUpdateColumn(editing.name, value);
    } else {
      await onCreateColumn(value);
    }

    setOpen(false);
    setEditing(null);
  };

  return (
    <div className={styles.wrapper}>
      <Table
        className={styles.dataTable}
        rowKey="name"
        loading={loading}
        dataSource={columns}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        columns={[
          {
            title: t('table.name'),
            dataIndex: 'name',
            width: 220,
          },
          {
            title: t('table.type'),
            dataIndex: 'dataType',
            width: 220,
          },
          {
            title: t('table.allowNull'),
            dataIndex: 'nullable',
            width: 120,
            render: value => (value ? 'YES' : 'NO'),
          },
          {
            title: t('table.default'),
            dataIndex: 'defaultValue',
            width: 260,
            render: value => (value ? String(value) : '-'),
          },
          {
            title: t('pgsql.identity'),
            key: 'identity',
            width: 180,
            render: (_, row) => (row.isIdentity ? row.identityGeneration || 'BY DEFAULT' : '-'),
          },
          {
            title: t('table.index'),
            dataIndex: 'isPrimaryKey',
            width: 160,
            render: value => (value ? 'PRIMARY' : '-'),
          },
          {
            title: t('table.comment'),
            dataIndex: 'comment',
            render: value => (value ? String(value) : '-'),
          },
          {
            title: (
              <>
                {t('table.operation')}
                <Button
                  className={styles.columnActionBtn}
                  color="cyan"
                  variant="link"
                  onClick={handleCreate}
                >
                  {t('button.add')}
                </Button>
              </>
            ),
            key: 'operation',
            width: 160,
            render: (_, row) => (
              <>
                <Button
                  className={styles.columnActionBtn}
                  color="cyan"
                  variant="link"
                  onClick={() => handleEdit(row)}
                >
                  {t('button.edit')}
                </Button>
                <Popconfirm
                  title={t('delete.title')}
                  description={t('delete.desc')}
                  onConfirm={() => onDeleteColumn(row.name)}
                >
                  <Button className={styles.columnActionBtn} color="danger" variant="link">
                    {t('button.delete')}
                  </Button>
                </Popconfirm>
              </>
            ),
          },
        ]}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('button.update') : t('button.add')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={COLUMN_EDITOR_MODAL_WIDTH}
        confirmLoading={isMutating}
        destroyOnHidden={true}
      >
        <Form<ColumnEditorFormValue>
          form={form}
          layout="vertical"
          initialValues={{ nullable: true, dataType: 'text' }}
        >
          <Form.Item label={t('table.name')} name="name" rules={[{ required: true }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item label={t('table.type')} name="dataType" rules={[{ required: true }]}>
            <Input autoComplete="off" placeholder="text / integer / varchar(255)" />
          </Form.Item>
          <Form.Item label={t('table.allowNull')} name="nullable" valuePropName="checked">
            <Switch checkedChildren="YES" unCheckedChildren="NO" />
          </Form.Item>
          <Form.Item label={t('table.default')} name="defaultValue">
            <Input autoComplete="off" placeholder="留空表示无默认值" />
          </Form.Item>
          <Form.Item label={t('table.comment')} name="comment">
            <Input autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StructurePanel;
