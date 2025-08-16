import React from "react";
import { Select, DatePicker, InputNumber, Input } from 'antd';
import dayjs from "dayjs";
import { Buffer } from "buffer";

import { FieldType, getPureType, fieldReflect, getConditionValue, geoValueToString } from "@/utils/mysql-type";

interface FieldEnterProps {
  type: string;
  name?: string;
  defaultValue?: any;
  onChange?: (name: string, value: any) => void;
  style?: React.CSSProperties;
  readonly?: boolean;
}

const pickerMap = {
  time: 'time',
  date: 'date',
  year: 'year',
  timestamp: 'date',
  datetime: 'date',
}

const formatMap = {
  time: 'HH:mm:ss',
  date: 'YYYY-MM-DD',
  year: 'YYYY',
  timestamp: 'YYYY-MM-DD HH:mm:ssZ',
  datetime: 'YYYY-MM-DD HH:mm:ssZ',
}

const FieldEnter: React.FC<FieldEnterProps> = (props) => {
  const { type, onChange = () => {}, defaultValue, name = 'not_name', readonly = false, style = {} } = props
  const pureType = getPureType(type)

  const handleChange = (value: any) => {
    const v = getConditionValue(value, type)
    onChange(name, v)
  }

  // 字符串类型
  if (fieldReflect[FieldType.STRING].includes(pureType)) {
    if (readonly) {
      return defaultValue
    }
  
    return <Input defaultValue={defaultValue} onChange={(e) => handleChange(e.target.value)} style={{ width: '100%', ...style }} />
  }

  // 数字类型
  if (fieldReflect[FieldType.NUMBER].includes(pureType)) {
    if (readonly) {
      return defaultValue
    }

    return <InputNumber defaultValue={defaultValue} onChange={handleChange} style={{ width: '100%', ...style }} />
  }

  // 时间日期类型
  if (fieldReflect[FieldType.DAY].includes(pureType)) {
    const isFullDateTime = ['timestamp', 'datetime'].includes(type)
    const value = type === 'time' ? `2000-01-01 ${defaultValue}` : defaultValue
    const props = defaultValue ? { defaultValue: dayjs(String(value)) } : {}

    if (readonly) {
      if (!defaultValue) {
        return null
      }

      return isFullDateTime ? dayjs(defaultValue).format('YYYY-MM-DD HH:mm:ssZ') : defaultValue
    }

    return (
      <DatePicker
        { ...props }
        onChange={(_data, dataString) => {
          if (isFullDateTime) {
            handleChange(_data.format('YYYY-MM-DD HH:mm:ssZ'))
          } else {
            handleChange(dataString)
          }
        }}
        style={{ width: '100%', ...style }}
        showTime={isFullDateTime}
        // @ts-expect-error sure
        format={formatMap[type]}
        // @ts-expect-error sure
        picker={pickerMap[type]}
      />
    )
  }

  // 数组类型
  if (fieldReflect[FieldType.ARRAY].includes(pureType)) {
    const isSet = type.startsWith('set(')
    const options = type
      .match(/(set|enum)\((.*)\)/)?.[2]
      ?.split(',').map(v => v.slice(1,  -1))
      .map(v => ({ label: v, value: v }))
    const value = isSet && typeof defaultValue === 'string' ? defaultValue.split(',') : defaultValue

    if (readonly) {
      return Array.isArray(defaultValue) ? defaultValue.join(',') : defaultValue
    }

    return (
      <Select
        mode={isSet ? 'multiple' : undefined}
        defaultValue={value}
        onChange={handleChange}
        style={{ width: '100%', ...style }}
        options={options || []}
      />
    )
  }

  // JSON类型
  if (fieldReflect[FieldType.JSON].includes(pureType)) {
    const value = defaultValue ? JSON.stringify(defaultValue) : null
    if (readonly) {
      return value
    }

    return (
      <Input.TextArea
        defaultValue={value || undefined}
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    )
  }

  // 二进制位
  if (fieldReflect[FieldType.BIT].includes(pureType)) {
    let value
    if (Array.isArray(defaultValue?.data)) {
      const buffer = Buffer.from(defaultValue?.data || []);
      const binaryString16 = buffer.toString('hex');
      const binaryString2 = parseInt(binaryString16, 16).toString(2);
      const len = Number(type.slice(4, -1))
      value = binaryString2.padStart(len, '0')
    }

    if (readonly) {
      return value
    }

    return (
      <Input
        addonBefore="b'"
        addonAfter="'"
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    )
  }

  // 二进制字符串
  if (fieldReflect[FieldType.BINARY].includes(pureType)) {
    const data = defaultValue?.data || []
    let lastNonZeroIndex = data.length - 1;
    while (lastNonZeroIndex >= 0 && data[lastNonZeroIndex] === 0) {
      lastNonZeroIndex --;
    }
    const validData = data.slice(0, lastNonZeroIndex + 1);
    const value = Buffer.from(validData).toString()

    if (readonly) {
      return value
    }

    return (
      <Input
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    )
  }

  // 二进制文件(暂不支持修改)
  if (fieldReflect[FieldType.BLOB].includes(pureType)) {
    const v = `(BLOB) ${defaultValue?.data?.length || 0} bytes`
    if (readonly) {
      return defaultValue ? v : null
    }

    return <Input defaultValue={v} readOnly onChange={(e) => handleChange(e.target.value)} style={{ width: '100%', ...style }} />
  }

  // 空间数据
  if (fieldReflect[FieldType.GEO].includes(pureType)) {
    const value = geoValueToString(defaultValue)

    if (readonly) {
      return value
    }

    return (
      <Input
        defaultValue={value || undefined}
        addonBefore="ST_GeomFromText('"
        addonAfter="')"
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    )
  }
}

export default FieldEnter