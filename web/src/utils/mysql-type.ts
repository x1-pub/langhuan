import { Buffer } from "buffer"

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DAY = 'day',
  ARRAY = 'array',
  BLOB = 'blob',
  JSON = 'json',
  BIT = 'bit',
  BINARY = 'binary',
  GEO = 'geo',
}

export const fieldReflect = {
  [FieldType.STRING]: ['char', 'varchar', 'text', 'tinytext', 'mediumtext', 'longtext'],
  [FieldType.NUMBER]: ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'float', 'double', 'decimal', 'numeric', 'real'],
  [FieldType.DAY]: ['year', 'timestamp', 'datetime', 'time', 'date'],
  [FieldType.ARRAY]: ['enum', 'set'],
  [FieldType.BLOB]: ['blob', 'mediumblob', 'tinyblob', 'longblob'],
  [FieldType.JSON]: ['json'],
  [FieldType.BIT]: ['bit'],
  [FieldType.BINARY]: ['binary', 'varbinary'],
  [FieldType.GEO]: ['geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geomcollection'],
}

export const getPureType = (type: string) => {
  if (typeof type !== 'string') {
    return ''
  }

  return type.split('(')[0]
}

export const geoValueToString = (v: any) => {
  if (!v?.type) {
    return null
  }

  const deep: (coor: any) => string = (coor: any) => {
    if (Object.prototype.toString.call(coor) === '[object Object]') {
      return `${coor.type.toLocaleUpperCase()}(${deep(coor.coordinates || coor.geometries)})`
    }

    if (Number(coor[0]) === coor[0]) {
      return coor.join(' ')
    } else {
      if (Array.isArray(coor[0][0])) {
        return coor.map((c: any) => `(${deep(c)})`).join(', ')
      }
      return coor.map((c: any) => deep(c)).join(', ')
    }
  }

  return deep(v)
}

const stringToBufferArray = (str: string) => {
  const buffer = Buffer.from(str);
  const bufferArray = Array.from(buffer); 

  return bufferArray
}

const binaryStringToBufferArray = (bstr: string) => {
  const paddedBinaryString = bstr.padStart(Math.ceil(bstr.length / 8) * 8, '0');
  const byteStrings = paddedBinaryString.match(/.{1,8}/g)!;
  const buffer = Buffer.from(byteStrings.map(byte => parseInt(byte, 2)));
  const bufferArray = Array.from(buffer)
  
  return bufferArray
}

export const getConditionValue = (value: any, type: string) => {
  const pureType = getPureType(type)

  if (value == null) {
    return null
  }

  if (fieldReflect[FieldType.JSON].includes(pureType)) {
    if (typeof value === 'string') {
      return value ? { type: 'json', value } : null
    }

    return { type: 'json', value: JSON.stringify(value) }
  }

  if (fieldReflect[FieldType.ARRAY].includes(pureType)) {
    return Array.isArray(value) ? value.join(',') : value
  }

  if (fieldReflect[FieldType.DAY].includes(pureType)) {
    return value || null
  }

  if (fieldReflect[FieldType.BINARY].includes(pureType)) {
    if (typeof value === 'string') {
      return value ? { type: 'buffer', value: stringToBufferArray(value) } : null
    }

    return value.data ? { type: 'buffer', value: value?.data } : null
  }

  if (fieldReflect[FieldType.BIT].includes(pureType)) {
    if (typeof value === 'string') {
      return value ? { type: 'buffer', value: binaryStringToBufferArray(value) } : null
    }

    return value.data ? { type: 'buffer', value: value.data } : null
  }

  if (fieldReflect[FieldType.BLOB].includes(pureType)) {
    return {
      type: 'buffer',
      value: typeof value === 'string' ? stringToBufferArray(value) : value?.data
    }
  }

  if (fieldReflect[FieldType.GEO].includes(pureType)) {
    if (typeof value === 'string') {
      return value ? { type: 'spatial', value } : null
    }

    const v = geoValueToString(value)
    return v ? { type: 'spatial', value: v } : null
  }

  return value
}
