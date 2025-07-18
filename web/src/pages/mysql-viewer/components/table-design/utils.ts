import { type TableIndex, IndexType } from "@/api/mysql";

export const dealIndexData = (data: TableIndex[]) => {
  const map: Record<string, TableIndex[]> = {}

  data.forEach(d => {
    if (map[d.Key_name]) {
      map[d.Key_name].push(d)
    } else {
      map[d.Key_name] = [d]
    }
  })

  const result = Object.keys(map).map(k => {
    const list = map[k]
    const col = { ...map[k][0] }
    col.Column_name = list.map(l => l.Column_name).join(',')
    return col
  })

  return result
}

export const getTypeFromIndexData = (record: TableIndex) => {
  if (record.Key_name === 'PRIMARY' && record.Non_unique === 0) {
    return IndexType.PRIMARY
  }
  if (record.Key_name !== 'PRIMARY' && record.Non_unique === 0) {
    return IndexType.UNIQUE
  }
  if (record.Index_type === 'BTREE' && record.Non_unique === 1) {
    return IndexType.INDEX
  }
  if (record.Index_type === 'FULLTEXT') {
    return IndexType.FULLTEXT
  }
  if (record.Index_type === 'SPATIAL') {
    return IndexType.SPATIAL
  }

  console.warn(`Description Failed to identify the index type: ${record}`)
  return IndexType.UNIQUE
}
