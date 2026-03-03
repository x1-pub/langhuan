import type { TableProps } from 'antd';

import EllipsisText from '@/components/ellipsis-text';
import { formatMongoValue, ROW_KEY_FIELD } from '../../shared';

export const buildDynamicColumns = <T extends Record<string, unknown>>(
  rows: T[],
): NonNullable<TableProps<T>['columns']> => {
  const columnKeys = new Set<string>();
  rows.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== ROW_KEY_FIELD) {
        columnKeys.add(key);
      }
    });
  });

  const orderedKeys = Array.from(columnKeys).sort((a, b) => {
    if (a === '_id') return -1;
    if (b === '_id') return 1;
    return a.localeCompare(b);
  });

  return orderedKeys.map(key => ({
    title: key,
    dataIndex: key,
    key,
    width: 260,
    render: (value: unknown) => (
      <EllipsisText text={formatMongoValue(value)} width={key === '_id' ? 240 : 220} />
    ),
    ellipsis: true,
  }));
};
