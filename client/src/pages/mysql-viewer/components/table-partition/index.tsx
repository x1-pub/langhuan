import React from 'react';
import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { trpc, RouterOutput, RouterInput } from '@/infra/api/trpc';
import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import useNamedEntityModal from '../shared/use-named-entity-modal';
import { CrudActionButtons, CrudActionColumnTitle } from '../shared/crud-action-column';
import PartitionModal from './modal';
import styles from '../../index.module.less';

type TPartition = RouterOutput['mysql']['getPartitions'][number];

type TFormValue = RouterInput['mysql']['addPartition'];

const TablePartition: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  } = useNamedEntityModal<TPartition>();

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

  const columns: TableColumnsType<TPartition> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('mysql.partitionMethod'),
      dataIndex: 'method',
      key: 'method',
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: t('mysql.partitionExpression'),
      dataIndex: 'expression',
      key: 'expression',
      ellipsis: true,
    },
    {
      title: t('mysql.partitionDescription'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('mysql.partitionRows'),
      dataIndex: 'rows',
      key: 'rows',
    },
    {
      title: t('mysql.partitionDataLength'),
      dataIndex: 'dataLength',
      key: 'dataLength',
    },
    {
      title: t('mysql.partitionIndexLength'),
      dataIndex: 'indexLength',
      key: 'indexLength',
    },
    {
      title: <CrudActionColumnTitle onAdd={openCreateModal} />,
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

  const handleEdit = (partition: TPartition) => {
    openEditModal(partition);
  };

  const handleDelete = async (name: string) => {
    await deletePartitionMutation.mutateAsync({ connectionId, dbName, tableName, name });
    closeIfEditingTarget(name);
  };

  const handleModalSubmit = async (values: Pick<TFormValue, 'definition'>) => {
    if (editingEntity) {
      await updatePartitionMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        definition: values.definition,
        oldName: editingEntity.name,
      });
    } else {
      await addPartitionMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        definition: values.definition,
      });
    }

    closeModal();
  };

  const handleModalCancel = () => {
    closeModal();
  };

  return (
    <div className={styles.wrapper}>
      <Table<TPartition>
        className={styles.dataTable}
        columns={columns}
        dataSource={getPartitionsQuery.data}
        rowKey="name"
        loading={getPartitionsQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '100%' }}
      />

      <PartitionModal
        visible={modalOpen}
        editingName={editingEntity?.name ?? null}
        loading={updatePartitionMutation.isPending || addPartitionMutation.isPending}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default TablePartition;
