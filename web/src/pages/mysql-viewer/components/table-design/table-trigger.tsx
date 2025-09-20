import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Popconfirm,
  Tooltip,
  Tag,
  Card
} from 'antd';
import { useTranslation } from 'react-i18next';
import TriggerModal from './trigger-modal';
import styles from './index.module.less'
import { addTrigger, deleteTrigger, modifyTrigger, tableTrigger, TriggerData, TriggerEvent, TriggerTiming } from '@/api/mysql';
import useMain from '@/utils/use-main';

const TableTrigger: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useMain()
  const [triggers, setTriggers] = useState<TriggerData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerData | null>(null);
  const [viewingTrigger, setViewingTrigger] = useState<TriggerData | null>(null);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true)
    const data = await tableTrigger({ connectionId, dbName, tableName })
    setTriggers(data)
    setLoading(false)
  }

  useEffect(() => {
    getData()
  }, []);

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
      render: (event: TriggerEvent) => (
        <Tag color={getEventColor(event)}>{event}</Tag>
      )
    },
    {
      title: t('table.timing'),
      dataIndex: 'timing',
      key: 'timing',
      width: 100,
      render: (timing: TriggerTiming) => (
        <Tag color={getTimingColor(timing)}>{timing}</Tag>
      )
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
      )
    },
    {
      title: t('table.operation'),
      key: 'action',
      width: 140,
      render: (_: any, record: TriggerData) => (
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
            <Button
              className={styles.columnActionBtn}
              color="danger"
              variant="link"
            >
              {t('button.delete')}
            </Button>
          </Popconfirm>
        </>
      )
    }
  ];

  const getEventColor = (event: TriggerEvent): string => {
    const colorMap: Record<TriggerEvent, string> = {
      [TriggerEvent.INSERT]: 'green',
      [TriggerEvent.UPDATE]: 'orange',
      [TriggerEvent.DELETE]: 'red'
    };
    return colorMap[event] || 'default';
  };

  const getTimingColor = (timing: TriggerTiming): string => {
    const colorMap: Record<TriggerTiming, string> = {
      [TriggerTiming.BEFORE]: 'blue',
      [TriggerTiming.AFTER]: 'purple'
    };
    return colorMap[timing] || 'default';
  };

  const handleAdd = () => {
    setEditingTrigger(null);
    setViewingTrigger(null);
    setIsModalVisible(true);
  };

  const handleEdit = (trigger: TriggerData) => {
    setEditingTrigger(trigger);
    setViewingTrigger(null);
    setIsModalVisible(true);
  };

  const handleView = (trigger: TriggerData) => {
    setViewingTrigger(trigger);
    setEditingTrigger(null);
    setIsModalVisible(true);
  };

  const handleDelete = async (name: string) => {
    await deleteTrigger({ connectionId, dbName, tableName, name })
    getData()
  };

  const handleModalSubmit = async (values: TriggerData) => {
    if (editingTrigger) {
      await modifyTrigger({ connectionId, dbName, tableName, ...values, oldName: editingTrigger.name })
    } else {
      await addTrigger({ connectionId, dbName, tableName, ...values })
    }

    getData()
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTrigger(null);
    setViewingTrigger(null);
  };

  return (
    <>
      <Card
        className={styles.card}
        title={t('mysql.trigger')}
        extra={<Button color="cyan" variant="link" onClick={handleAdd}>{t('button.add')}</Button>}
      >
        <Table
          columns={columns}
          dataSource={triggers}
          rowKey="name"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onDoubleClick: () => handleView(record),
          })}
        />

        <TriggerModal
          visible={isModalVisible}
          editingTrigger={editingTrigger}
          viewingTrigger={viewingTrigger}
          loading={loading}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
        />
      </Card>
    </>
  );
};

export default TableTrigger;