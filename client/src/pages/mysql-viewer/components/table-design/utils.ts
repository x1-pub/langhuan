import { EMySQLIndexType, IMySQLTableIndex } from '@packages/types/mysql';

export const dealIndexData = (data: IMySQLTableIndex[]) => {
  const map: Record<string, IMySQLTableIndex[]> = {};

  data.forEach(d => {
    if (map[d.Key_name]) {
      map[d.Key_name].push(d);
    } else {
      map[d.Key_name] = [d];
    }
  });

  const result = Object.keys(map).map(k => {
    const list = map[k];
    const col = { ...map[k][0] };
    col.Column_name = list.map(l => l.Column_name).join(',');
    return col;
  });

  return result;
};

export const getTypeFromIndexData = (record: IMySQLTableIndex) => {
  if (record.Key_name === 'PRIMARY' && record.Non_unique === 0) {
    return EMySQLIndexType.PRIMARY;
  }
  if (record.Key_name !== 'PRIMARY' && record.Non_unique === 0) {
    return EMySQLIndexType.UNIQUE;
  }
  if (record.Index_type === 'BTREE' && record.Non_unique === 1) {
    return EMySQLIndexType.INDEX;
  }
  if (record.Index_type === 'FULLTEXT') {
    return EMySQLIndexType.FULLTEXT;
  }
  if (record.Index_type === 'SPATIAL') {
    return EMySQLIndexType.SPATIAL;
  }

  console.error(`Description Failed to identify the index type: ${record}`);
  return EMySQLIndexType.UNIQUE;
};
