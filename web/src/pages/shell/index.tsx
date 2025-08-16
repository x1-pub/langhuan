import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Spin } from 'antd';

import { executeSql } from "@/api/mysql";
import { type ConnectionDetails, ConnectionType, getConnectionDetails } from "@/api/connection";
import useNotification from "@/utils/use-notifition";
import Terminal from "./terminal";
import { executeRedisCommand } from "@/api/redis";
import { executeMongoCommand } from "@/api/mongodb";

const Shell: React.FC = () => {
  const notify = useNotification()
  const { connectionType, connectionId } = useParams()
  const [connection, setConnection] = useState<ConnectionDetails>()

  const handleCommand = async (command: string) => {
    if (!connection) {
      throw new Error('Database Disconnected')
    }

    if (connection.type === 'mysql') {
      return executeSql({ connectionId: connection?.id, sql: command })
    }

    if (connection.type === 'redis') {
      return executeRedisCommand({ connectionId: connection?.id, command  })
    }

    if (connection.type === 'mongodb') {
      return executeMongoCommand({ connectionId: connection?.id, command  })
    }

    return {
      result: '',
    }
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
      <Terminal
        onCommand={handleCommand}
        name={connection.name}
        type={connectionType as ConnectionType}
      />
    </div>
  )
}

export default Shell