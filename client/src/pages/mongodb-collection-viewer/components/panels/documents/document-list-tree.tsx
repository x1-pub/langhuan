import React from 'react';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

import { formatListValue, getObjectEntries, isExpandableValue, TListValueType } from '../../shared';
import styles from '../../../index.module.less';

interface DocumentListTreeProps {
  fieldName: string;
  value: unknown;
  path: string;
  depth: number;
  listExpandedMap: Record<string, boolean>;
  onToggleListExpanded: (path: string) => void;
}

const getListValueClassName = (type: TListValueType) => {
  switch (type) {
    case 'objectId':
      return styles.listValueObjectId;
    case 'string':
      return styles.listValueString;
    case 'date':
      return styles.listValueDate;
    case 'number':
      return styles.listValueNumber;
    case 'boolean':
      return styles.listValueBoolean;
    case 'summary':
      return styles.listValueSummary;
    case 'null':
    case 'undefined':
      return styles.listValueNullish;
    default:
      return styles.listValuePlain;
  }
};

const DocumentListTree: React.FC<DocumentListTreeProps> = ({
  fieldName,
  value,
  path,
  depth,
  listExpandedMap,
  onToggleListExpanded,
}) => {
  const expandable = isExpandableValue(value);
  const expanded = !!listExpandedMap[path];
  const formatted = formatListValue(fieldName, value);

  const children = expandable
    ? Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as [string, unknown])
      : getObjectEntries(value as Record<string, unknown>)
    : [];

  return (
    <>
      <div className={styles.listLine} style={{ paddingLeft: `${depth * 18}px` }}>
        {expandable ? (
          <span className={styles.listExpandIcon} onClick={() => onToggleListExpanded(path)}>
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        ) : (
          <span className={styles.listExpandPlaceholder} />
        )}

        <span className={styles.listFieldName}>{fieldName}</span>
        <span className={styles.listColon}>:</span>
        <span className={`${styles.listValue} ${getListValueClassName(formatted.type)}`}>
          {formatted.text}
        </span>
      </div>

      {expandable &&
        expanded &&
        children.map(([childKey, childValue]) => (
          <DocumentListTree
            key={`${path}.${childKey}`}
            fieldName={childKey}
            value={childValue}
            path={`${path}.${childKey}`}
            depth={depth + 1}
            listExpandedMap={listExpandedMap}
            onToggleListExpanded={onToggleListExpanded}
          />
        ))}
    </>
  );
};

export default DocumentListTree;
