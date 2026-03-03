import React, { useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';

import { formatByteSize } from '@/shared/formatters/byte-size';
import styles from '../index.module.less';

const PARTITION_MODAL_WIDTH = 'var(--layout-modal-width-sm)';

interface PartitionItem {
  name: string;
  strategy: string;
  partitionKey: string;
  bound: string;
  totalSize: string | number;
  liveRows: string | number;
}

interface PartitionsPanelProps {
  loading: boolean;
  partitions: PartitionItem[];
  isMutating: boolean;
  onCreate: (partitionName: string, definition: string) => Promise<void>;
  onUpdate: (oldName: string, partitionName: string, definition: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

interface IPartitionForm {
  partitionName: string;
  definition: string;
}

const toSafeNumber = (value: string | number | undefined) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

const PartitionsPanel: React.FC<PartitionsPanelProps> = ({
  loading,
  partitions,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<IPartitionForm>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartitionItem | null>(null);

  const columns: TableColumnsType<PartitionItem> = [
    {
      title: t('table.partition'),
      dataIndex: 'name',
      key: 'name',
      width: 280,
    },
    {
      title: t('pgsql.partitionStrategy'),
      dataIndex: 'strategy',
      key: 'strategy',
      width: 120,
      render: value => <Tag color="cyan">{value || '-'}</Tag>,
    },
    {
      title: t('pgsql.partitionKey'),
      dataIndex: 'partitionKey',
      key: 'partitionKey',
      width: 240,
      ellipsis: true,
      render: value => (value ? String(value) : '-'),
    },
    {
      title: t('pgsql.partitionBound'),
      dataIndex: 'bound',
      key: 'bound',
      width: 280,
      ellipsis: true,
      render: value => (value ? String(value) : '-'),
    },
    {
      title: t('pgsql.partitionRows'),
      dataIndex: 'liveRows',
      key: 'liveRows',
      width: 140,
      render: value => toSafeNumber(value).toLocaleString(),
    },
    {
      title: t('pgsql.partitionSize'),
      dataIndex: 'totalSize',
      key: 'totalSize',
      width: 160,
      render: value => formatByteSize(toSafeNumber(value)),
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
      partitionName: '',
      definition: '',
    });
    setOpen(true);
  }

  function handleEdit(record: PartitionItem) {
    setEditing(record);
    form.setFieldsValue({
      partitionName: record.name,
      definition: record.bound || '',
    });
    setOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    if (editing) {
      await onUpdate(editing.name, values.partitionName, values.definition);
    } else {
      await onCreate(values.partitionName, values.definition);
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
        dataSource={partitions}
        pagination={false}
        scroll={{ x: 'max-content', y: '100%' }}
        locale={{
          emptyText: t('pgsql.noPartition'),
        }}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
      />

      <Modal
        title={editing ? t('pgsql.editPartition') : t('pgsql.createPartition')}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        width={PARTITION_MODAL_WIDTH}
        confirmLoading={isMutating}
        destroyOnHidden={true}
      >
        <Form<IPartitionForm> layout="vertical" form={form}>
          <Form.Item label={t('table.name')} name="partitionName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('pgsql.partitionDefinition')}
            name="definition"
            rules={[{ required: true }]}
            extra={t('pgsql.partitionDefinitionTip')}
          >
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PartitionsPanel;
