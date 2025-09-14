import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Popconfirm,
  message,
  Tooltip,
  Tag,
  Card
} from 'antd';
import { useTranslation } from 'react-i18next';
import TriggerModal, { TriggerData, TriggerEvent, TriggerTiming } from './trigger-modal';
import styles from './index.module.less'

const TableTrigger: React.FC = () => {
  const { t } = useTranslation();
  const [triggers, setTriggers] = useState<TriggerData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerData | null>(null);
  const [viewingTrigger, setViewingTrigger] = useState<TriggerData | null>(null);
  const [loading, setLoading] = useState(false);

  // 模拟初始数据
  useEffect(() => {
    const mockData: TriggerData[] = [
      {
        id: '1',
        name: 'update_modified_time',
        event: TriggerEvent.UPDATE,
        timing: TriggerTiming.BEFORE,
        tableName: 'users',
        statement: 'SET NEW.updated_at = NOW();',
        created: '2024-01-15 10:30:00',
        sqlMode: 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
        characterSetClient: 'utf8mb4',
        collationConnection: 'utf8mb4_unicode_ci'
      },
      {
        id: '2',
        name: 'log_user_deletion',
        event: TriggerEvent.DELETE,
        timing: TriggerTiming.AFTER,
        tableName: 'users',
        statement: 'INSERT INTO user_logs (action, user_id, deleted_at) VALUES (\'DELETE\', OLD.id, NOW());',
        created: '2024-01-20 14:20:00',
        sqlMode: 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
        characterSetClient: 'utf8mb4',
        collationConnection: 'utf8mb4_unicode_ci'
      }
    ];
    setTriggers(mockData);
  }, []);

  const columns = [
    {
      title: '触发器名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '事件',
      dataIndex: 'event',
      key: 'event',
      width: 100,
      render: (event: TriggerEvent) => (
        <Tag color={getEventColor(event)}>{event}</Tag>
      )
    },
    {
      title: '时机',
      dataIndex: 'timing',
      key: 'timing',
      width: 100,
      render: (timing: TriggerTiming) => (
        <Tag color={getTimingColor(timing)}>{timing}</Tag>
      )
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      width: 150,
      render: (text: string) => text
    },
    {
      title: '触发器语句',
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
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
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
            onConfirm={() => handleDelete(record.id!)}
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

  // 获取事件类型颜色
  const getEventColor = (event: TriggerEvent): string => {
    const colorMap: Record<TriggerEvent, string> = {
      [TriggerEvent.INSERT]: 'green',
      [TriggerEvent.UPDATE]: 'orange',
      [TriggerEvent.DELETE]: 'red'
    };
    return colorMap[event] || 'default';
  };

  // 获取时机颜色
  const getTimingColor = (timing: TriggerTiming): string => {
    const colorMap: Record<TriggerTiming, string> = {
      [TriggerTiming.BEFORE]: 'blue',
      [TriggerTiming.AFTER]: 'purple'
    };
    return colorMap[timing] || 'default';
  };

  // 处理新建触发器
  const handleAdd = () => {
    setEditingTrigger(null);
    setViewingTrigger(null);
    setIsModalVisible(true);
  };

  // 处理编辑触发器
  const handleEdit = (trigger: TriggerData) => {
    setEditingTrigger(trigger);
    setViewingTrigger(null);
    setIsModalVisible(true);
  };

  // 处理查看触发器
  const handleView = (trigger: TriggerData) => {
    setViewingTrigger(trigger);
    setEditingTrigger(null);
    setIsModalVisible(true);
  };

  // 处理删除触发器
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      // 这里调用删除API
      // await deleteTrigger(id);

      setTriggers(prev => prev.filter(t => t.id !== id));
      message.success('触发器删除成功');
    } catch (error) {
      message.error('触发器删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理Modal提交
  const handleModalSubmit = async (values: TriggerData) => {
    try {
      setLoading(true);

      if (editingTrigger) {
        // 编辑模式
        const updatedTrigger = { ...values, id: editingTrigger.id };

        // 这里调用编辑API
        // await updateTrigger(updatedTrigger);

        setTriggers(prev =>
          prev.map(t => t.id === editingTrigger.id ? updatedTrigger : t)
        );
        message.success('触发器更新成功');
      } else {
        // 新建模式
        const newTrigger = {
          ...values,
          id: Date.now().toString(),
          created: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(/\//g, '-')
        };

        // 这里调用新建API
        // await createTrigger(newTrigger);

        setTriggers(prev => [...prev, newTrigger]);
        message.success('触发器创建成功');
      }

      setIsModalVisible(false);
    } catch (error) {
      message.error('操作失败，请检查输入信息');
    } finally {
      setLoading(false);
    }
  };

  // 处理Modal取消
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
          rowKey="id"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onDoubleClick: () => handleView(record),
          })}
        // scroll={{ x: 1000 }}
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