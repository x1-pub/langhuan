import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Spin } from 'antd';

import { executeSql } from "@/api/mysql";
import { type ConnectionDetails, getConnectionDetails } from "@/api/connection";
import useNotification from "@/utils/use-notifition";
import MySQLShell from "./mysql-shell";

const Shell: React.FC = () => {
  const notify = useNotification()
  const { connectionType, connectionId } = useParams()
  const [connection, setConnection] = useState<ConnectionDetails>()
  const dbName = useRef<string>(undefined)
  const title =
    connectionType === 'mysql' ? 'MySQL shell' :
    connectionType === 'mongodb' ? 'MongoDB shell' :
    connectionType === 'redis' ? 'Redis Shell' : undefined

  const handleCommand = async (sql: string) => {
    if (!connection) {
      throw new Error('Database Disconnected')
    }

    if (connection.type === 'mysql') {
      if (sql.trim().endsWith(';')) {
        return executeSql({ connectionId: connection?.id, dbName: dbName.current, sql })
      }
      return '\n\r'
    }

    return ''
  }

  const authUrl = async () => {
    const connection = await getConnectionDetails(connectionId!)
    if (!connection || connection.type !== connectionType) {
      notify.error({
        message: '发生错误',
        description: <span style={{ whiteSpace: 'pre-wrap' }}>您访问的资源不存在, 请检查URL是否正确</span>,
        duration: null,
      })
      return
    }
    setConnection(connection)
  }

  useEffect(() => {
    authUrl()
  }, [connectionId, connectionType])

  if (!connection) {
    return <Spin spinning={true} fullscreen size="large" />
  }
  
  return (
    <div style={{ height: '100vh' }}>
      <MySQLShell
        onCommand={handleCommand}
        title={`${title} (${connection?.name})`}
      />
    </div>
  )
}

export default Shell