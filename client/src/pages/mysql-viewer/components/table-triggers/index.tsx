import React from 'react';
import { Table, Tooltip, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { EMySQLTriggerEvent, EMySQLTriggerTiming, TMySQLTrigger } from '@packages/types/mysql';
import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import { trpc } from '@/infra/api/trpc';
import useNamedEntityModal from '../shared/use-named-entity-modal';
import { CrudActionButtons, CrudActionColumnTitle } from '../shared/crud-action-column';
import TriggerModal from './modal';
import styles from '../../index.module.less';

const EVENT_COLOR_MAP: Record<EMySQLTriggerEvent, string> = {
  [EMySQLTriggerEvent.INSERT]: 'green',
  [EMySQLTriggerEvent.UPDATE]: 'orange',
  [EMySQLTriggerEvent.DELETE]: 'red',
};

const TIMING_COLOR_MAP: Record<EMySQLTriggerTiming, string> = {
  [EMySQLTriggerTiming.BEFORE]: 'blue',
  [EMySQLTriggerTiming.AFTER]: 'purple',
};

const TableTriggers: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  } = useNamedEntityModal<TMySQLTrigger>();

  const getTriggersQuery = useQuery(
    trpc.mysql.getTriggers.queryOptions({ connectionId, dbName, tableName }),
  );
  const addTriggerMutation = useMutation(
    trpc.mysql.addTrigger.mutationOptions({ onSuccess: () => getTriggersQuery.refetch() }),
  );
  const deleteTriggerMutation = useMutation(
    trpc.mysql.deleteTrigger.mutationOptions({ onSuccess: () => getTriggersQuery.refetch() }),
  );
  const updateTriggerMutation = useMutation(
    trpc.mysql.updateTrigger.mutationOptions({ onSuccess: () => getTriggersQuery.refetch() }),
  );

  const columns: TableColumnsType<TMySQLTrigger> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('table.event'),
      dataIndex: 'event',
      key: 'event',
      render: (event: EMySQLTriggerEvent) => <Tag color={EVENT_COLOR_MAP[event]}>{event}</Tag>,
    },
    {
      title: t('table.timing'),
      dataIndex: 'timing',
      key: 'timing',
      render: (timing: EMySQLTriggerTiming) => <Tag color={TIMING_COLOR_MAP[timing]}>{timing}</Tag>,
    },
    {
      title: t('table.statement'),
      dataIndex: 'statement',
      key: 'statement',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ cursor: 'pointer' }}>{text}</span>
        </Tooltip>
      ),
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

  const handleEdit = (trigger: TMySQLTrigger) => {
    openEditModal(trigger);
  };

  const handleDelete = async (name: string) => {
    await deleteTriggerMutation.mutateAsync({ connectionId, dbName, tableName, name });
    closeIfEditingTarget(name);
  };

  const handleModalSubmit = async (values: TMySQLTrigger) => {
    if (editingEntity) {
      await updateTriggerMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        ...values,
        oldName: editingEntity.name,
      });
    } else {
      await addTriggerMutation.mutateAsync({ connectionId, dbName, tableName, ...values });
    }

    closeModal();
  };

  const handleModalCancel = () => {
    closeModal();
  };

  return (
    <div className={styles.wrapper}>
      <Table
        className={styles.dataTable}
        columns={columns}
        dataSource={getTriggersQuery.data}
        rowKey="name"
        loading={getTriggersQuery.isLoading}
        pagination={false}
        onRow={record => ({
          onDoubleClick: () => handleEdit(record),
        })}
        scroll={{ y: '100%' }}
      />

      <TriggerModal
        visible={modalOpen}
        editingTrigger={editingEntity}
        loading={updateTriggerMutation.isPending || addTriggerMutation.isPending}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default TableTriggers;
