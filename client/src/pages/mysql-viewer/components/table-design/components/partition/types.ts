// 分区类型枚举
export enum EPartitionType {
  RANGE = 'RANGE',
  LIST = 'LIST',
  HASH = 'HASH',
  KEY = 'KEY',
  RANGE_COLUMNS = 'RANGE COLUMNS',
  LIST_COLUMNS = 'LIST COLUMNS',
  LINEAR_HASH = 'LINEAR HASH',
  LINEAR_KEY = 'LINEAR KEY',
}

// 分区数据接口
export interface IPartitionData {
  id?: string;
  name: string;
  type: EPartitionType;
  expression?: string;
  columns?: string[];
  value?: string;
  description?: string;
  engine?: string;
  dataDirectory?: string;
  indexDirectory?: string;
  maxRows?: number;
  minRows?: number;
  comment?: string;
}
