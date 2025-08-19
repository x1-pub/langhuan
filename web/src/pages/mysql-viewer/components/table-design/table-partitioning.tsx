import React from "react";
import { Button, Card } from "antd";

interface TablePartitioningProps {

}

const TablePartitioning: React.FC<TablePartitioningProps> = (props) => {
  console.log(props)

  return (
    <div>
      <Card title="分区" extra={<Button color="cyan" variant="link">新建</Button>}>

      </Card>
    </div>
  )
}

export default TablePartitioning
