import React from 'react';
import { Button, Card, Checkbox, Popconfirm, Space } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { getObjectEntries, IMongoTableRow, isObjectIdString } from '../../shared';
import DocumentListTree from './document-list-tree';
import styles from '../../../index.module.less';

interface DocumentListCardProps {
  row: IMongoTableRow;
  selected: boolean;
  onToggleRowSelection: (rowKey: string, checked: boolean) => void;
  onOpenEdit: (row: IMongoTableRow) => void;
  onDeleteByIds: (ids: unknown[]) => void;
  listExpandedMap: Record<string, boolean>;
  onToggleListExpanded: (path: string) => void;
}

const DocumentListCard: React.FC<DocumentListCardProps> = ({
  row,
  selected,
  onToggleRowSelection,
  onOpenEdit,
  onDeleteByIds,
  listExpandedMap,
  onToggleListExpanded,
}) => {
  const { t } = useTranslation();
  const { __mongo_row_key: rowKey, ...doc } = row;
  const orderedEntries = getObjectEntries(doc);
  const disableEdit = doc._id === undefined;

  return (
    <Card
      key={rowKey}
      size="small"
      className={`${styles.listCard} ${selected ? styles.listCardActive : ''}`}
      title={
        <div className={styles.listCardHeader}>
          <Space size={10}>
            <Checkbox
              checked={selected}
              onChange={event => onToggleRowSelection(rowKey, event.target.checked)}
            />
            <span className={styles.listCardTitle}>
              {typeof doc._id === 'string' && isObjectIdString(doc._id)
                ? `ObjectId('${doc._id}')`
                : String(doc._id || t('mongodb.noId'))}
            </span>
          </Space>

          <Space size={4}>
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={disableEdit}
              onClick={() => onOpenEdit(row)}
            />
            <Popconfirm
              title={t('delete.title')}
              description={t('delete.desc')}
              disabled={disableEdit}
              onConfirm={() => {
                if (doc._id !== undefined) {
                  onDeleteByIds([doc._id]);
                }
              }}
            >
              <Button type="text" icon={<DeleteOutlined />} danger={true} disabled={disableEdit} />
            </Popconfirm>
          </Space>
        </div>
      }
    >
      <div className={styles.listTree}>
        {orderedEntries.map(([fieldName, fieldValue]) => (
          <DocumentListTree
            key={`${rowKey}.${fieldName}`}
            fieldName={fieldName}
            value={fieldValue}
            path={`${rowKey}.${fieldName}`}
            depth={0}
            listExpandedMap={listExpandedMap}
            onToggleListExpanded={onToggleListExpanded}
          />
        ))}
      </div>
    </Card>
  );
};

export default DocumentListCard;
