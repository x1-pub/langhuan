import React, { useEffect, useState } from "react";
import { Button, Card, Popconfirm, Table, TableProps, Tooltip } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
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

import { getPureType } from "@/utils/mysql-type";
import { type Column, columnOrder, deleteColumn } from "@/api/mysql";
import FieldEditor from "./field-editor";
import styles from './index.module.less'
import useMain from "@/utils/use-main";

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<Readonly<RowProps>> = (props) => {
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
  data: Column[];
  onOk?: () => void;
}

const ColumnsManager: React.FC<ColumnsManagerProps> = (props) => {
  const { t } = useTranslation()
  const { connectionId, dbName, tableName } = useMain()
  const { data, onOk } = props
  const [dataOrder, setDataOrder] = useState<Column[]>([])
  const [visible, setVisible] = useState(false)
  const [editRow, setEditRow] = useState<Column>()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
        distance: 1,
      },
    }),
  );
  const tableColumns: TableProps<Column>['columns'] = [
    {
      title: '',
      dataIndex: 'order',
      render: () => <HolderOutlined />,
      width: 40,
    },
    {
      title: '名称',
      dataIndex: 'Field',
    },
    {
      title: '类型',
      dataIndex: 'Type',
      render: (value) => getPureType(value),
    },
    {
      title: 'Null',
      dataIndex: 'Null',
    },
    {
      title: '注释',
      dataIndex: 'Comment',
    },
    {
      title: '操作',
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
  ]

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataOrder((prev) => {
        const activeIndex = prev.findIndex((i) => i.Field === active.id);
        const overIndex = prev.findIndex((i) => i.Field === over?.id);
        const newColumns = arrayMove(prev, activeIndex, overIndex)
        handleColumnOrder(newColumns.map(column => column.Field))
        return newColumns;
      });
    }
  };

  const handleColumnOrder = async (fields: string[]) => {
    await columnOrder({ fields, connectionId, dbName, tableName })
      .catch(() => setDataOrder(data))
  }

  const handleSubmit = () => {
    setEditRow(undefined)
    setVisible(false)
    onOk?.()
  }

  const handleCancel = () => {
    setEditRow(undefined)
    setVisible(false)
  }

  const handleEdit = (record: Column) => {
    setEditRow(record)
    setVisible(true)
  }

  const handleDelete = async (record: Column) => {
    await deleteColumn({ connectionId, dbName, tableName, name: record.Field })
    onOk?.()
  }

  useEffect(() => {
    setDataOrder([...data])
  }, [data])

  return (
    <div>
      <Card className={styles.card} title="字段" extra={<Button color="cyan" variant="link" onClick={() => setVisible(true)}>新建</Button>}>
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            // rowKey array
            items={dataOrder.map((i) => i.Field)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              rowKey="Field"
              dataSource={dataOrder}
              columns={tableColumns}
              pagination={false}
              onRow={(record) => ({
                onDoubleClick: () => handleEdit(record),
              })}
              components={{
                body: { row: Row },
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>
      <FieldEditor visible={visible} onSubmit={handleSubmit} onCancel={handleCancel} editRow={editRow} />
    </div>
  )
}

export default ColumnsManager
