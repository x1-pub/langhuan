import React, { useEffect, useState } from "react";
import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';

import { tableStatus, TableStatusRsp } from "@/api/mysql";
import useMain from "@/utils/use-main"

const TableSatus: React.FC = () => {
  const [data, setData] = useState<TableStatusRsp>()
  const { connectionId, dbName, tableName } = useMain()
  const items: DescriptionsProps['items'] = [
    {
      label: '数据库名称',
      children: dbName,
    },
    {
      label: '表名称',
      children: tableName,
    },
    {
      label: '行数(估值)',
      children: data?.['TABLE_ROWS'] ?? '-',
    },
    {
      label: '数据长度',
      children: data?.['DATA_LENGTH'] ?? '-',
    },
    {
      label: '引擎',
      children: data?.['ENGINE'] ?? '-',
    },
    {
      label: '创建日期',
      children: data?.['CREATE_TIME'] ?? '-',
    },
    {
      label: '修改日期',
      children: data?.['UPDATE_TIME'] ?? '-',
    },
    {
      label: '排序规则',
      children: data?.['TABLE_COLLATION'] ?? '-',
    },
    {
      label: '行格式',
      children: data?.['ROW_FORMAT'] ?? '-',
    },
    {
      label: '平均行长度',
      children: data?.['AVG_ROW_LENGTH'] ?? '-',
    },
    {
      label: '最大数据长度',
      children: data?.['MAX_DATA_LENGTH'] ?? '-',
    },
    {
      label: '索引长度',
      children: data?.['INDEX_LENGTH'] ?? '-',
    },
    {
      label: '自动递增',
      children: data?.['AUTO_INCREMENT'] ?? '-',
    },
    {
      label: '表注释',
      children: data?.['TABLE_COMMENT'] ?? '-',
    },
  ]

  const getData = async () => {
    const data = await tableStatus({ connectionId, dbName, tableName })
    setData(data)
  }

  useEffect(() => {
    getData()
  }, [])

  return <Descriptions column={{ xs:1, sm:1, md: 1, lg: 1, xl:2, xxl: 3 }} bordered items={items} />
}

export default TableSatus
