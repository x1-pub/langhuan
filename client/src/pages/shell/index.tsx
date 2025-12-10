import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Spin } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';

import { showError } from '@/utils/global-notification';
import TerminalV2 from './terminal-v2';
import { trpc } from '@/utils/trpc';
import { EConnectionType } from '@packages/types/connection';

const PAGE_ID = `110${Date.now()}${Math.random().toString().slice(-6)}`;

const Shell: React.FC = () => {
  const { connectionType, connectionId } = useParams();
  const [prompt, setPrompt] = useState<string>();

  const connectionDetailQuery = useQuery(
    trpc.connection.getDetailById.queryOptions({ id: Number(connectionId) }),
  );
  const executeCommandMutation = useMutation(trpc.connection.executeCommand.mutationOptions());

  const handleCommandV2 = async (command: string) => {
    const connection = connectionDetailQuery.data;

    if (!connection) {
      throw new Error('Database Disconnected');
    }

    try {
      const { result, changeDatabase } = await executeCommandMutation.mutateAsync({
        type: connectionType as EConnectionType,
        connectionId: Number(connectionId),
        command,
        pageId: PAGE_ID,
      });
      if (changeDatabase) {
        setPrompt(`${changeDatabase}>`);
      }
      return result;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };

  if (!connectionDetailQuery.data) {
    return <Spin spinning={true} fullscreen size="large" />;
  }

  if (connectionDetailQuery.data.type !== connectionType) {
    showError('您访问的资源不存在, 请检查URL是否正确');
    return null;
  }

  return (
    <div style={{ height: '100vh' }}>
      <TerminalV2
        onExecuteCommand={handleCommandV2}
        title={connectionDetailQuery.data?.name}
        prompt={prompt}
        type={connectionType}
      />
    </div>
  );
};

export default Shell;
