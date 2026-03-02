import React, { useEffect, useImperativeHandle } from 'react';
import { Select, Popconfirm } from 'antd';
import type { SelectProps } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc } from '@/infra/api/trpc';
import ConnectionModal from '../connection-editor';
import DatabaseIcon from '../database-icon';
import EllipsisText from '@/components/ellipsis-text';
import styles from './index.module.less';
import { useTranslation } from 'react-i18next';

type LabelRender = SelectProps['labelRender'];

export interface RefHandler {
  refreshList: () => void;
}

const ConnectionSelector = React.forwardRef<RefHandler>(function ConnectionSelector(_, ref) {
  const { connectionId: connectionIdString } = useParams();
  const { t } = useTranslation();
  const selectedConnectionId = Number(connectionIdString) || undefined;

  const navigate = useNavigate();
  const location = useLocation();
  const [editId, setEditId] = React.useState<number>();

  const listQuery = useQuery(trpc.connection.getList.queryOptions());
  const deleteMutation = useMutation(trpc.connection.deleteById.mutationOptions());
  const connections = listQuery.data ?? [];

  const findConnectionById = (id?: number) => {
    if (!id) {
      return undefined;
    }

    return connections.find(connection => connection.id === id);
  };

  const navigateToConnection = (id: number) => {
    const connection = findConnectionById(id);
    if (!connection) {
      navigate('/notselected');
      return;
    }

    const nextPath = `/${connection.type}/${connection.id}`;
    if (nextPath !== location.pathname) {
      // Keep full-page navigation to avoid stale route params in long-lived layout state.
      window.location.assign(nextPath);
    }
  };

  const refreshConnections = () => {
    void listQuery.refetch();
  };

  const labelRender: LabelRender = props => {
    const connection = findConnectionById(Number(props.value));
    if (!connection) {
      return '';
    }

    return (
      <span className={styles.selectOption}>
        <DatabaseIcon type={connection.type} />
        <EllipsisText text={connection.name} />
      </span>
    );
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    refreshConnections();
  };

  const handleAfterEdit = () => {
    setEditId(undefined);
    refreshConnections();
  };

  useImperativeHandle(
    ref,
    () => ({
      refreshList: refreshConnections,
    }),
    [listQuery.refetch],
  );

  useEffect(() => {
    if (!selectedConnectionId || connections.length === 0) {
      return;
    }

    const connection = findConnectionById(selectedConnectionId);
    if (!connection) {
      navigate('/notselected');
      return;
    }

    const nextPath = `/${connection.type}/${connection.id}`;
    if (nextPath !== location.pathname) {
      window.location.assign(nextPath);
    }
  }, [connections, location.pathname, navigate, selectedConnectionId]);

  return (
    <>
      <Select<number>
        value={selectedConnectionId}
        fieldNames={{ value: 'id' }}
        options={connections}
        loading={listQuery.isLoading}
        className={styles.select}
        optionRender={option => (
          <span className={styles.selectOption}>
            <DatabaseIcon type={option.data.type} />
            <EllipsisText text={option.data.name} className={styles.optionText} />
            <span className={styles.handler} onClick={event => event.stopPropagation()}>
              <EditOutlined className={styles.icon} onClick={() => setEditId(option.data.id)} />
              <Popconfirm
                title={t('delete.title')}
                description={t('delete.desc')}
                onConfirm={() => handleDelete(option.data.id)}
              >
                <DeleteOutlined className={styles.icon} />
              </Popconfirm>
            </span>
          </span>
        )}
        labelRender={labelRender}
        onChange={navigateToConnection}
      />
      <ConnectionModal
        id={editId}
        open={Boolean(editId)}
        onOk={handleAfterEdit}
        onCancel={() => setEditId(undefined)}
      />
    </>
  );
});

export default ConnectionSelector;
