import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Result, Spin } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import TerminalV2 from './terminal-v2';
import { trpc } from '@/utils/trpc';
import { EConnectionType } from '@packages/types/connection';

const isConnectionType = (value?: string): value is EConnectionType => {
  return Object.values(EConnectionType).includes(value as EConnectionType);
};

const buildPromptByType = (type: EConnectionType, database?: string | null) => {
  switch (type) {
    case EConnectionType.MYSQL:
      return `${database || 'mysql'}>`;
    case EConnectionType.MARIADB:
      return `${database || 'mariadb'}>`;
    case EConnectionType.PGSQL:
      return `${database || 'postgres'}=>`;
    case EConnectionType.REDIS:
      return `[db${database || '0'}]>`;
    case EConnectionType.MONGODB:
      return `${database || 'test'}>`;
    default:
      return '>';
  }
};

const Shell: React.FC = () => {
  const { t } = useTranslation();
  const { connectionType: routeConnectionType, connectionId: routeConnectionId } = useParams();
  const connectionId = Number(routeConnectionId);
  const pageIdRef = useRef(`shell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [prompt, setPrompt] = useState<string>();
  const isValidRoute = isConnectionType(routeConnectionType) && Number.isFinite(connectionId);

  const connectionDetailQuery = useQuery(
    trpc.connection.getDetailById.queryOptions(
      { id: connectionId },
      {
        enabled: isValidRoute,
        retry: false,
      },
    ),
  );
  const executeCommandMutation = useMutation(trpc.connection.executeCommand.mutationOptions());

  useEffect(() => {
    const connection = connectionDetailQuery.data;
    if (!connection) {
      return;
    }
    setPrompt(buildPromptByType(connection.type, connection.database));
  }, [connectionDetailQuery.data]);

  const handleCommandV2 = async (command: string) => {
    const connection = connectionDetailQuery.data;

    if (!connection) {
      throw new Error(t('terminal.databaseDisconnected'));
    }

    try {
      const { result, changeDatabase } = await executeCommandMutation.mutateAsync({
        type: connection.type,
        connectionId,
        command,
        pageId: pageIdRef.current,
      });
      if (changeDatabase) {
        setPrompt(buildPromptByType(connection.type, changeDatabase));
      }
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  };

  if (!isValidRoute) {
    return <Result status="404" title="404" subTitle={t('terminal.invalidRoute')} />;
  }

  if (connectionDetailQuery.isLoading) {
    return <Spin spinning={true} fullscreen size="large" />;
  }

  if (connectionDetailQuery.error) {
    return (
      <Result
        status="error"
        title={t('terminal.loadConnectionFailed')}
        subTitle={connectionDetailQuery.error.message}
      />
    );
  }

  if (!connectionDetailQuery.data) {
    return <Result status="warning" title={t('terminal.databaseDisconnected')} />;
  }

  if (connectionDetailQuery.data.type !== routeConnectionType) {
    return <Result status="warning" title={t('terminal.connectionTypeMismatch')} />;
  }

  return (
    <div style={{ height: '100vh' }}>
      <TerminalV2
        onExecuteCommand={handleCommandV2}
        title={connectionDetailQuery.data?.name}
        prompt={prompt}
        type={connectionDetailQuery.data.type}
      />
    </div>
  );
};

export default Shell;
