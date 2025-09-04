import React from "react";
import { Button, Card } from "antd";
import { useTranslation } from "react-i18next";

interface TablePartitioningProps {

}

const TablePartitioning: React.FC<TablePartitioningProps> = (props) => {
  const { t } = useTranslation()
  console.log(props)

  return (
    <div>
      <Card title={t('table.partition')} extra={<Button color="cyan" variant="link">{t('button.add')}</Button>}>

      </Card>
    </div>
  )
}

export default TablePartitioning
