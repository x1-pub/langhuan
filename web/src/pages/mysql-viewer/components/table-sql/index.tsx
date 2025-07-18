import React, { useEffect, useState } from "react";

import { tableSQL } from "@/api/mysql";
import useMain from "@/utils/use-main"
import { useThemeMode } from "antd-style";
import CodeEditor from "@/components/code-editor";
import styles from './index.module.less'

const TableSQL: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const [sql, setSql] = useState('')
  const { connectionId, dbName, tableName } = useMain()

  const getData = async () => {
    const data = await tableSQL({ connectionId, dbName, tableName });
    setSql(data)
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <div className={styles.tableSql}>
      <CodeEditor value={sql} theme={isDarkMode ? 'vs-dark' : 'vs'} readOnly={true} language="sql" />
    </div>
  )
}

export default TableSQL
