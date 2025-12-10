import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Tag, Card } from 'antd';
import PartitionModal from './modal';
import styles from '../../index.module.less';
import { useTranslation } from 'react-i18next';
import { IPartitionData, EPartitionType } from './types';

const TablePartition: React.FC = () => {
  const { t } = useTranslation();
  const [partitions, setPartitions] = useState<IPartitionData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPartition, setEditingPartition] = useState<IPartitionData | null>(null);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: EPartitionType) => <Tag color={getPartitionTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '分区表达式',
      dataIndex: 'expression',
      key: 'expression',
      width: 150,
      render: (text: string) => text,
    },
    {
      title: '分区列',
      dataIndex: 'columns',
      key: 'columns',
      width: 120,
      render: (columns: string[]) => columns?.join(', '),
    },
    {
      title: '分区值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (text: string) => text,
    },
    {
      title: t('table.comment'),
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (text: string) => text,
    },
    {
      title: t('table.operation'),
      key: 'action',
      render: (_: unknown, record: IPartitionData) => (
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
            <Button className={styles.columnActionBtn} color="danger" variant="link">
              {t('button.delete')}
            </Button>
          </Popconfirm>
        </>
      ),
      width: 140,
    },
  ];

  const getPartitionTypeColor = (type: EPartitionType): string => {
    const colorMap: Record<EPartitionType, string> = {
      [EPartitionType.RANGE]: 'green',
      [EPartitionType.LIST]: 'blue',
      [EPartitionType.HASH]: 'orange',
      [EPartitionType.KEY]: 'purple',
      [EPartitionType.RANGE_COLUMNS]: 'cyan',
      [EPartitionType.LIST_COLUMNS]: 'geekblue',
      [EPartitionType.LINEAR_HASH]: 'gold',
      [EPartitionType.LINEAR_KEY]: 'magenta',
    };
    return colorMap[type] || 'default';
  };

  const handleAdd = () => {
    setEditingPartition(null);
    setIsModalVisible(true);
  };

  const handleEdit = (partition: IPartitionData) => {
    setEditingPartition(partition);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      // 这里调用删除API
      // await deletePartition(id);

      setPartitions(prev => prev.filter(p => p.id !== id));
      message.success('分区删除成功');
    } catch {
      message.error('分区删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (values: IPartitionData) => {
    try {
      setLoading(true);

      if (editingPartition) {
        // 编辑模式
        const updatedPartition = { ...values, id: editingPartition.id };

        // 这里调用编辑API
        // await updatePartition(updatedPartition);

        setPartitions(prev => prev.map(p => (p.id === editingPartition.id ? updatedPartition : p)));
        message.success('分区更新成功');
      } else {
        // 新建模式
        const newPartition = {
          ...values,
          id: Date.now().toString(),
        };

        // 这里调用新建API
        // await createPartition(newPartition);

        setPartitions(prev => [...prev, newPartition]);
        message.success('分区创建成功');
      }

      setIsModalVisible(false);
    } catch {
      message.error('操作失败，请检查输入信息');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Card
        className={styles.card}
        title={t('mysql.partition')}
        extra={
          <Button color="cyan" variant="link" onClick={handleAdd}>
            {t('button.add')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={partitions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <PartitionModal
          visible={isModalVisible}
          editingPartition={editingPartition}
          loading={loading}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
        />
      </Card>
    </>
  );
};

export default TablePartition;
