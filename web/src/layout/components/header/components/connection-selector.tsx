import React, { useState, useEffect, useImperativeHandle } from "react";
import { Select } from "antd";
import type { SelectProps } from 'antd';
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router";
// import { useTranslation } from "react-i18next";

import ConnectionModal from "@/components/connection-modal";
import { deleteConnection, getConnectionList, modifyConnection, type Connection, type CreateConnectionParams } from "@/api/connection";
import ConnectionTypeIcon from "./connection-type";
import EllipsisText from "@/components/ellipsis-text";
import styles from './index.module.less'

type LabelRender = SelectProps['labelRender']

export interface RefHandler {
  refreshList: () => void
}

const ConnectionSelector: React.FC<{ ref?: React.Ref<RefHandler> }> = ({ ref }) => {
  const { connectionId = '' } = useParams()
  const navigate  = useNavigate()
  const location = useLocation()
  const [list, setList] = useState<Connection[]>([])
  const [editId, setEditId] = useState<string | number>()
  const [loading, setLoading] = useState<boolean>(false)

  const findByConnectionId = (data: Connection[], connectionId: string | number) => {
    return data.find(c => c.connectionId === Number(connectionId))
  }

  const handleConnectionChange = (value: string | number) => {
    if (Number(value) === Number(connectionId)) {
      return
    }

    const connection = findByConnectionId(list, value)
    if (!connection) {
      navigate('/notselected')
      return
    }
    
    window.location.href = `/${connection.connectionType}/${connection.connectionId}`
  }

  const labelRender: LabelRender = (props) => {
    const { value } = props
    const connection = findByConnectionId(list, String(value))
    if (!connection) {
      return ''
    }

    return <span className={styles.selectOption}>
      <ConnectionTypeIcon type={connection?.connectionType} />
      <EllipsisText text={connection?.connectionName} />
    </span>
  }

  const fetchList = async () => {
    const data = await getConnectionList()
    setList(data)

    const selected = findByConnectionId(data, connectionId)
    if (!selected) {
      navigate('/notselected')
      return
    }

    const path = `/${selected?.connectionType}/${connectionId}`
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  const handleSubmit = async (data: CreateConnectionParams) => {
    setLoading(true)
    await modifyConnection({ ...data, id: editId! }).finally(() => setLoading(false))
    
    if (Number(connectionId) === Number(editId)) {
      window.location.reload()
      return
    }
    fetchList()
    setEditId(undefined)
  }

  const handleEditConnection = (event: React.MouseEvent<HTMLSpanElement>, id: string | number) => {
    event.stopPropagation()
    setEditId(id)
  }

  const handleDelete = async (event: React.MouseEvent<HTMLSpanElement>, id: string | number) => {
    event.stopPropagation()
    await deleteConnection(id)
    fetchList()
    if (Number(connectionId) === Number(id)) {
      navigate('/notselected')
    }
  }

  useImperativeHandle(ref, () => ({
    refreshList: fetchList
  }))

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <>    
      <Select
        defaultValue={connectionId}
        fieldNames={{ value: 'connectionId' }}
        style={{ width: 300 }}
        options={list}
        optionRender={(option) => (
          <span className={styles.selectOption}>
            <ConnectionTypeIcon type={option.data.connectionType} />
            <EllipsisText text={option.data.connectionName} width={200} />
            <span className={styles.selecthandler}>
              <EditOutlined className={styles.icon} onClick={(e) => handleEditConnection(e, option.data.connectionId)} />
              <DeleteOutlined className={styles.icon} onClick={(e) => handleDelete(e, option.data.connectionId)} />
            </span>
          </span>
        )}
        labelRender={labelRender}
        onChange={handleConnectionChange}
      />
      <ConnectionModal
        id={editId}
        loading={loading}
        open={!!editId}
        onOk={handleSubmit}
        onCancel={() => setEditId(undefined)}
      />
    </>
  )
}

export default ConnectionSelector