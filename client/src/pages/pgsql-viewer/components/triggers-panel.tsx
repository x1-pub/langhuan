import React, { useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';

const TRIGGER_MODAL_WIDTH = 'var(--layout-modal-width-xl)';

interface TriggerItem {
  name: string;
  timing: string;
  event: string;
  status: string;
  definition: string;
}

interface TriggersPanelProps {
  loading: boolean;
  triggers: TriggerItem[];
  isMutating: boolean;
  onCreate: (definition: string) => Promise<void>;
  onUpdate: (oldName: string, definition: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

interface ITriggerForm {
  definition: string;
}

const TriggersPanel: React.FC<TriggersPanelProps> = ({
  loading,
  triggers,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ITriggerForm>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TriggerItem | null>(null);

  const columns: TableColumnsType<TriggerItem> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 260,
    },
    {
      title: t('table.timing'),
      dataIndex: 'timing',
      width: 140,
      render: value => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: t('table.event'),
      dataIndex: 'event',
      width: 180,
      render: value => <Tag color="purple">{value || '-'}</Tag>,
    },
    {
      title: t('pgsql.triggerStatus'),
      dataIndex: 'status',
      width: 140,
      render: value => (
        <Tag color={value === 'ENABLED' ? 'success' : 'default'}>{value || '-'}</Tag>
      ),
    },
    {
      title: (
        <>
          {t('table.operation')}
          <Button color="cyan" variant="link" onClick={handleCreate}>
            {t('button.add')}
          </Button>
        </>
      ),
      key: 'action',
      width: 170,
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
            onConfirm={() => onDelete(row.name)}
          >
            <Button className={styles.columnActionBtn} color="danger" variant="link">
              {t('button.delete')}
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  function handleCreate() {
    setEditing(null);
    form.setFieldsValue({
      definition: '',
    });
    setOpen(true);
  }

  function handleEdit(record: TriggerItem) {
    setEditing(record);
    form.setFieldsValue({
      definition: record.definition || '',
    });
    setOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    if (editing) {
      await onUpdate(editing.name, values.definition);
    } else {
      await onCreate(values.definition);
    }

    setOpen(false);
    setEditing(null);
  }

  return (
    <div className={styles.wrapper}>
      <Table
        className={styles.dataTable}
        rowKey="name"
        loading={loading}
        columns={columns}
        dataSource={triggers}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('pgsql.editTrigger') : t('pgsql.createTrigger')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={TRIGGER_MODAL_WIDTH}
        confirmLoading={isMutating}
        destroyOnHidden={true}
      >
        <Form<ITriggerForm> layout="vertical" form={form}>
          <Form.Item
            label={t('pgsql.definitionSql')}
            name="definition"
            rules={[{ required: true }]}
          >
            <Input.TextArea autoSize={{ minRows: 10, maxRows: 22 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TriggersPanel;
