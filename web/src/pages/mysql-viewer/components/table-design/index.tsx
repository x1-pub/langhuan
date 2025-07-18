import React, { useEffect, useState } from "react";
import { Space } from "antd";

import { tableColumns, tableIndex, type Column, type TableIndex } from "@/api/mysql";
import IndexManager from "./index-manager";
import ColumnsManager from "./columns-manager";
import useMain from "@/utils/use-main"

const TableDesign: React.FC = () => {
  const { connectionId, dbName, tableName } = useMain()
  const [columns, setColumns] = useState<Column[]>([])
  const [indexData, setIndexData] = useState<TableIndex[]>([])

  const getData = async () => {
    const [data1, data2] = await Promise.all([tableColumns({ connectionId, dbName, tableName }), tableIndex({ connectionId, dbName, tableName })])
    setColumns(data1)
    setIndexData(data2)
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%'}}>    
        <IndexManager data={indexData} columns={columns} onOk={getData} />
        <ColumnsManager data={columns} onOk={getData} />
      </Space>
    </div>
  )
}

export default TableDesign
