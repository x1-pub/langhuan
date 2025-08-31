import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Spin } from 'antd';

import { executeMySqlCommand } from "@/api/mysql";
import { type ConnectionDetails, ConnectionType, getConnectionDetails } from "@/api/connection";
import { showError } from "@/utils/use-notifition";
import TerminalV2 from "./terminal-v2";
import { executeRedisCommand } from "@/api/redis";
import { executeMongoCommand } from "@/api/mongodb";

const SESSION_ID = `110${Date.now()}${Math.random().toString().slice(-6)}`

const Shell: React.FC = () => {
  const { connectionType, connectionId } = useParams()
  const [connection, setConnection] = useState<ConnectionDetails>()
  const [prompt, setPrompt] = useState<string>('')

  const handleCommandV2 = async (command: string) => {
    if (!connection) {
      throw new Error('Database Disconnected')
    }

    try {
      const fn =
        connection.type === 'mysql' ? executeMySqlCommand :
          connection.type === 'redis' ? executeRedisCommand : executeMongoCommand

      const { result, changeDatabase } = await fn({ connectionId: connection?.id, command, sessionId: SESSION_ID })
      if (changeDatabase) {
        setPrompt(`${changeDatabase}>`)
      }
      return result

    } catch (err) {
      return err instanceof Error ? err.message : String(err)
    }
  }

  const authUrl = async () => {
    const connection = await getConnectionDetails(connectionId!)
    if (!connection || connection.type !== connectionType) {
      showError('您访问的资源不存在, 请检查URL是否正确')
      return
    }
    setConnection(connection)
    setPrompt(`${connection.type}>`)
  }

  useEffect(() => {
    authUrl()
  }, [connectionId, connectionType])

  if (!connection) {
    return <Spin spinning={true} fullscreen size="large" />
  }

  return (
    <div style={{ height: '100vh' }}>
      <TerminalV2
        onExecuteCommand={handleCommandV2}
        title={connection.name}
        prompt={prompt}
        type={connectionType as ConnectionType}
      />
    </div>
  )
}

export default Shell