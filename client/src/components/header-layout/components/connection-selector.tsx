import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';

import { trpc } from '@/utils/trpc';
import ConnectionModal from './connection-modal';
import ConnectionTypeIcon from './connection-type';
import EllipsisText from '@/components/ellipsis-text';
import styles from './index.module.less';

type LabelRender = SelectProps['labelRender'];

export interface RefHandler {
  refreshList: () => void;
}

const ConnectionSelector: React.FC<{ ref?: React.Ref<RefHandler> }> = ({ ref }) => {
  const { connectionId: connectionIdString } = useParams();
  const connectionId = Number(connectionIdString) || undefined;

  const navigate = useNavigate();
  const location = useLocation();
  const [editId, setEditId] = useState<number>();

  const listQuery = useQuery(trpc.connection.getList.queryOptions());
  const deleteMutation = useMutation(trpc.connection.deleteById.mutationOptions());

  const findByConnectionId = (id?: number) => {
    return listQuery.data?.find(c => c.id === id);
  };

  const handleSelectedConnectionIdChange = (selectedId: number) => {
    if (!listQuery.data) {
      return;
    }

    const connection = findByConnectionId(selectedId);
    if (!connection) {
      navigate('/notselected');
      return;
    }

    const path = `/${connection.type}/${connection.id}`;
    if (path !== location.pathname) {
      // TODO: why not use 'navigate(path)'? bug: connectionId is out of sync with wind
      window.location.href = path;
    }
  };

  const labelRender: LabelRender = props => {
    const { value } = props;
    const connection = findByConnectionId(Number(value));
    if (!connection) {
      return '';
    }

    return (
      <span className={styles.selectOption}>
        <ConnectionTypeIcon type={connection?.type} />
        <EllipsisText text={connection?.name} />
      </span>
    );
  };

  const handleEditConnection = (event: React.MouseEvent<HTMLSpanElement>, id: number) => {
    event.stopPropagation();
    setEditId(id);
  };

  const handleDelete = async (event: React.MouseEvent<HTMLSpanElement>, id: number) => {
    event.stopPropagation();
    await deleteMutation.mutateAsync({ id: Number(id) });
    listQuery.refetch();
  };

  const handleAfterEdit = () => {
    setEditId(undefined);
    listQuery.refetch();
  };

  useImperativeHandle(ref, () => ({
    refreshList: listQuery.refetch,
  }));

  useEffect(() => {
    handleSelectedConnectionIdChange(Number(connectionId));
  }, [listQuery.data]);

  return (
    <>
      <Select
        defaultValue={connectionId}
        fieldNames={{ value: 'id' }}
        style={{ width: 300 }}
        options={listQuery.data}
        optionRender={option => (
          <span className={styles.selectOption}>
            <ConnectionTypeIcon type={option.data.type} />
            <EllipsisText text={option.data.name} width={200} />
            <span className={styles.selecthandler}>
              <EditOutlined
                className={styles.icon}
                onClick={e => handleEditConnection(e, option.data.id)}
              />
              <DeleteOutlined
                className={styles.icon}
                onClick={e => handleDelete(e, option.data.id)}
              />
            </span>
          </span>
        )}
        labelRender={labelRender}
        onChange={handleSelectedConnectionIdChange}
      />
      <ConnectionModal
        id={editId}
        open={!!editId}
        onOk={handleAfterEdit}
        onCancel={() => setEditId(undefined)}
      />
    </>
  );
};

export default ConnectionSelector;
