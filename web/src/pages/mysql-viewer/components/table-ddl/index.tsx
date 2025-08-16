import React, { useEffect, useState } from "react";

import { tableDDL } from "@/api/mysql";
import useMain from "@/utils/use-main"
import { useThemeMode } from "antd-style";
import CodeEditor from "@/components/code-editor";
import styles from './index.module.less'

const TableDDL: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const [ddl, setDDL] = useState('')
  const { connectionId, dbName, tableName } = useMain()

  const getData = async () => {
    const data = await tableDDL({ connectionId, dbName, tableName });
    setDDL(data)
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <div className={styles.tableDdl}>
      <CodeEditor value={ddl} theme={isDarkMode ? 'vs-dark' : 'vs'} readOnly={true} language="sql" />
    </div>
  )
}

export default TableDDL
