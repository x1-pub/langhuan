import React, { useEffect, useState } from 'react';
import { Button, Card, Popconfirm, Table, TableProps, Tooltip } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@tanstack/react-query';

import FieldEditor from '../field-editor';
import styles from '../../index.module.less';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { IMySQLColumn, IMySQLTableIndex } from '@packages/types/mysql';
import PrimaryIcon from '../primary-icon';
import { trpc } from '@/utils/trpc';
import { getMySQLPureType } from '@/utils/mysql-generator';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<Readonly<RowProps>> = props => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

interface ColumnsManagerProps {
  data: IMySQLColumn[];
  index: IMySQLTableIndex[];
  onOk?: () => void;
}

const ColumnsManager: React.FC<ColumnsManagerProps> = props => {
  const { index, data, onOk } = props;
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [dataOrder, setDataOrder] = useState<IMySQLColumn[]>([]);
  const [visible, setVisible] = useState(false);
  const [editRow, setEditRow] = useState<IMySQLColumn>();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
        distance: 1,
      },
    }),
  );

  const sortMysqlColumnMutation = useMutation(trpc.mysql.sortMysqlColumn.mutationOptions());
  const deleteColumnMutation = useMutation(trpc.mysql.deleteColumn.mutationOptions());

  const tableColumns: TableProps<IMySQLColumn>['columns'] = [
    {
      title: '',
      dataIndex: 'order',
      render: () => <HolderOutlined />,
      width: 40,
    },
    {
      title: t('table.name'),
      dataIndex: 'Field',
      render: (_value, record) => {
        const primary = index.find(
          item => item.Key_name === 'PRIMARY' && item.Column_name === record.Field,
        );
        return (
          <>
            {record.Field}
            {!!primary && <PrimaryIcon seg={primary.Seq_in_index} />}
          </>
        );
      },
    },
    {
      title: t('table.type'),
      dataIndex: 'Type',
      render: value => getMySQLPureType(value),
    },
    {
      title: 'Null',
      dataIndex: 'Null',
    },
    {
      title: t('table.comment'),
      dataIndex: 'Comment',
    },
    {
      title: t('table.operation'),
      dataIndex: '',
      render: (_, record) => (
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
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip placement="top" title={data.length === 1 ? 'xxxx' : ''}>
              <Button
                className={styles.columnActionBtn}
                color="danger"
                variant="link"
                disabled={data.length === 1}
              >
                {t('button.delete')}
              </Button>
            </Tooltip>
          </Popconfirm>
        </>
      ),
      width: 140,
    },
  ];

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataOrder(prev => {
        const activeIndex = prev.findIndex(i => i.Field === active.id);
        const overIndex = prev.findIndex(i => i.Field === over?.id);
        const newColumns = arrayMove(prev, activeIndex, overIndex);
        handleColumnOrder(newColumns.map(column => column.Field));
        return newColumns;
      });
    }
  };

  const handleColumnOrder = async (fields: string[]) => {
    await sortMysqlColumnMutation
      .mutateAsync({ fields, connectionId, dbName, tableName })
      .catch(() => setDataOrder(data));
  };

  const handleSubmit = () => {
    setEditRow(undefined);
    setVisible(false);
    onOk?.();
  };

  const handleCancel = () => {
    setEditRow(undefined);
    setVisible(false);
  };

  const handleEdit = (record: IMySQLColumn) => {
    setEditRow(record);
    setVisible(true);
  };

  const handleDelete = async (record: IMySQLColumn) => {
    await deleteColumnMutation.mutateAsync({ connectionId, dbName, tableName, name: record.Field });
    onOk?.();
  };

  useEffect(() => {
    setDataOrder([...data]);
  }, [data]);

  return (
    <>
      <Card
        className={styles.card}
        title={t('table.field')}
        extra={
          <Button color="cyan" variant="link" onClick={() => setVisible(true)}>
            {t('button.add')}
          </Button>
        }
      >
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            // rowKey array
            items={dataOrder.map(i => i.Field)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              rowKey="Field"
              dataSource={dataOrder}
              columns={tableColumns}
              pagination={false}
              onRow={record => ({
                onDoubleClick: () => handleEdit(record),
              })}
              components={{
                body: { row: Row },
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>
      <FieldEditor
        visible={visible}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        editRow={editRow}
      />
    </>
  );
};

export default ColumnsManager;
