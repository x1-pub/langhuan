import React, { useMemo, useState } from 'react';
import { Button, Popconfirm, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { trpc, RouterOutput, RouterInput } from '@/utils/trpc';
import useDatabaseWindows from '@/hooks/use-database-windows';
import PartitionModal from './modal';
import styles from '../../index.module.less';

type TPartition = RouterOutput['mysql']['getPartitions'][number];

type TFormValue = RouterInput['mysql']['addPartition'];

const TablePartition: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPartition, setEditingPartition] = useState<TPartition | null>(null);

  const getPartitionsQuery = useQuery(
    trpc.mysql.getPartitions.queryOptions({ connectionId, dbName, tableName }),
  );

  const addPartitionMutation = useMutation(
    trpc.mysql.addPartition.mutationOptions({ onSuccess: () => getPartitionsQuery.refetch() }),
  );
  const deletePartitionMutation = useMutation(
    trpc.mysql.deletePartition.mutationOptions({ onSuccess: () => getPartitionsQuery.refetch() }),
  );
  const updatePartitionMutation = useMutation(
    trpc.mysql.updatePartition.mutationOptions({ onSuccess: () => getPartitionsQuery.refetch() }),
  );

  const handleAdd = () => {
    setEditingPartition(null);
    setIsModalVisible(true);
  };

  const columns: TableColumnsType<TPartition> = useMemo(() => {
    return [
      {
        title: t('table.name'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '方法',
        dataIndex: 'method',
        key: 'method',
        render: (value: string) => <Tag color="blue">{value || '-'}</Tag>,
      },
      {
        title: '表达式',
        dataIndex: 'expression',
        key: 'expression',
        ellipsis: true,
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '行数',
        dataIndex: 'rows',
        key: 'rows',
      },
      {
        title: '数据长度',
        dataIndex: 'dataLength',
        key: 'dataLength',
      },
      {
        title: '索引长度',
        dataIndex: 'indexLength',
        key: 'indexLength',
      },
      {
        title: (
          <>
            {t('table.operation')}
            <Button color="cyan" variant="link" onClick={handleAdd}>
              {t('button.add')}
            </Button>
          </>
        ),
        key: 'action',
        width: 170,
        render: (_: unknown, record: TPartition) => (
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
    ];
  }, [t]);

  const handleEdit = (partition: TPartition) => {
    setEditingPartition(partition);
    setIsModalVisible(true);
  };

  const handleDelete = async (name: string) => {
    await deletePartitionMutation.mutateAsync({ connectionId, dbName, tableName, name });
  };

  const handleModalSubmit = async (values: Pick<TFormValue, 'definition'>) => {
    if (editingPartition) {
      await updatePartitionMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        definition: values.definition,
        oldName: editingPartition.name,
      });
    } else {
      await addPartitionMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        definition: values.definition,
      });
    }

    setIsModalVisible(false);
    setEditingPartition(null);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingPartition(null);
  };

  return (
    <div className={styles.wrapper}>
      <Table<TPartition>
        columns={columns}
        dataSource={getPartitionsQuery.data}
        rowKey="name"
        loading={getPartitionsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: 'calc(100vh - 195px)' }}
      />

      <PartitionModal
        visible={isModalVisible}
        editingName={editingPartition?.name || null}
        loading={updatePartitionMutation.isPending || addPartitionMutation.isPending}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default TablePartition;
