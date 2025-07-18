import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Spin } from 'antd';

import TerminalBox from './terminal'
import { executeSql } from "@/api/mysql";
import { type ConnectionDetails, getConnectionDetails } from "@/api/connection";
import useNotification from "@/utils/use-notifition";

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
      const res = await executeSql({ connectionId: connection?.id, dbName: dbName.current, sql })
      if (res.results.changedDatabase) {
        dbName.current = res.results.changedDatabase
        return 'Database changed'
      }
      return formatResult(res)
    }

    throw new Error(`${title} is under development, so stay tuned!\n\r${title} 正在开发中, 敬请期待!`)
  }

  const formatResult = (data: any) => {
    switch (data.type) {
      case 'SELECT':
        return formatTable(data.results);
      case 'UPDATE':
        return `Query OK, ${data.results.affectedRows} rows affected`;
      default:
        return JSON.stringify(data.results);
    }
  };
  
  const formatTable = (result: any) => {
    // 生成类似 MySQL 命令行表格输出
    const maxWidth = 300;
    const fields = result.fields;
    const rows = result.rows;
    
    // 计算列宽
    const colWidths = fields.map((field: string) => {
      const maxContentLength = Math.max(
        field.length,
        ...rows.map((row: any) => String(row[field]).length)
      );
      return Math.min(maxContentLength, maxWidth);
    });
  
    // 生成分隔线
    const separator = '+' + colWidths.map((w: number) => '-'.repeat(w + 2)).join('+') + '+';
  
    // 构建表头
    let output = separator + '\n\r|';
    fields.forEach((field: string, i: number) => {
      output += ` ${field.padEnd(colWidths[i])} |`;
    });
    
    output += '\n\r' + separator;
  
    // 构建数据行
    rows.forEach((row: any) => { // 限制显示行数
    // rows.slice(0, 5).forEach((row: any) => { // 限制显示行数
      output += '\n\r|';
      fields.forEach((field: string, i: number) => {
        let content = String(row[field]);
        if (content.length > maxWidth) {
          content = content.substring(0, maxWidth - 3) + '...';
        }
        output += ` ${content.padEnd(colWidths[i])} |`;
      });
    });
  
    // if (rows.length > 5) {
    //   output += `\n\r(+ ${rows.length - 5} more rows)`;
    // }
    return output + '\n\r' + separator;
  };

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
      <TerminalBox onCommand={handleCommand} title={`${title} (${connection?.name})`} prompt={`${connectionType}>`} />
    </div>
  )
}

export default Shell