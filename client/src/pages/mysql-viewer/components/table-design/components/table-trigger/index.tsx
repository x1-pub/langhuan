import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tooltip, Tag, Card } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import TriggerModal from './trigger-modal';
import styles from '../../index.module.less';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { trpc } from '@/utils/trpc';
import { EMySQLTriggerEvent, EMySQLTriggerTiming, TMySQLTrigger } from '@packages/types/mysql';

const TableTrigger: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TMySQLTrigger | null>(null);

  const getTriggersQuery = useQuery(
    trpc.mysql.getTriggers.queryOptions({ connectionId, dbName, tableName }),
  );
  const addTriggerMutation = useMutation(trpc.mysql.addTrigger.mutationOptions());
  const deleteTriggerMutation = useMutation(trpc.mysql.deleteTrigger.mutationOptions());
  const updateTriggerMutation = useMutation(trpc.mysql.updateTrigger.mutationOptions());

  const columns = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: t('table.event'),
      dataIndex: 'event',
      key: 'event',
      width: 100,
      render: (event: EMySQLTriggerEvent) => <Tag color={getEventColor(event)}>{event}</Tag>,
    },
    {
      title: t('table.timing'),
      dataIndex: 'timing',
      key: 'timing',
      width: 100,
      render: (timing: EMySQLTriggerTiming) => <Tag color={getTimingColor(timing)}>{timing}</Tag>,
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
      title: t('table.operation'),
      key: 'action',
      width: 140,
      render: (_: unknown, record: TMySQLTrigger) => (
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

  const getEventColor = (event: EMySQLTriggerEvent): string => {
    const colorMap: Record<EMySQLTriggerEvent, string> = {
      [EMySQLTriggerEvent.INSERT]: 'green',
      [EMySQLTriggerEvent.UPDATE]: 'orange',
      [EMySQLTriggerEvent.DELETE]: 'red',
    };
    return colorMap[event] || 'default';
  };

  const getTimingColor = (timing: EMySQLTriggerTiming): string => {
    const colorMap: Record<EMySQLTriggerTiming, string> = {
      [EMySQLTriggerTiming.BEFORE]: 'blue',
      [EMySQLTriggerTiming.AFTER]: 'purple',
    };
    return colorMap[timing] || 'default';
  };

  const handleAdd = () => {
    setEditingTrigger(null);
    setIsModalVisible(true);
  };

  const handleEdit = (trigger: TMySQLTrigger) => {
    setEditingTrigger(trigger);
    setIsModalVisible(true);
  };

  const handleDelete = async (name: string) => {
    await deleteTriggerMutation.mutateAsync({ connectionId, dbName, tableName, name });
    getTriggersQuery.refetch();
  };

  const handleModalSubmit = async (values: TMySQLTrigger) => {
    if (editingTrigger) {
      await updateTriggerMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        ...values,
        oldName: editingTrigger.name,
      });
    } else {
      await addTriggerMutation.mutateAsync({ connectionId, dbName, tableName, ...values });
    }

    getTriggersQuery.refetch();
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTrigger(null);
  };

  return (
    <>
      <Card
        className={styles.card}
        title={t('mysql.trigger')}
        extra={
          <Button color="cyan" variant="link" onClick={handleAdd}>
            {t('button.add')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={getTriggersQuery.data}
          rowKey="name"
          loading={getTriggersQuery.isLoading}
          pagination={false}
          onRow={record => ({
            onDoubleClick: () => handleEdit(record),
          })}
        />

        <TriggerModal
          visible={isModalVisible}
          editingTrigger={editingTrigger}
          loading={updateTriggerMutation.isPending || addTriggerMutation.isPending}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
        />
      </Card>
    </>
  );
};

export default TableTrigger;
