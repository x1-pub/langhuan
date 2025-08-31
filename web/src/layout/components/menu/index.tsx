import React, { useState, useEffect } from 'react'
import { List, Collapse, Spin, type CollapseProps, Button } from 'antd';
import { Outlet, useParams } from "react-router";
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { ConnectionType } from '@/api/connection'
import { deleteDB, getDBList, type Database } from '@/api/database';
import { getTableList, deleteTable, type Table } from '@/api/table';
import TableIcon from '@/assets/svg/table.svg?react'
import DBIcon from '@/assets/svg/db.svg?react'
import ShellIcon from '@/assets/svg/shell.svg?react'
import Editor, { EditorType } from './components/editor';
import styles from './index.module.less'
import { DatabaseContext, generateActiveId, IWind } from '@/utils/use-main';
import { Confirmation } from '@/components/confirmation-modal';
import EllipsisText from "@/components/ellipsis-text";

interface TableDataMap {
  [key: string]: Table[]
}

const MenuLayout: React.FC = () => {
  const { connectionId = '' } = useParams()
  const { t } = useTranslation()
  const connectionType = location.pathname.split('/')[1] as ConnectionType
  const [active, setActive] = useState<string>('')
  const [spinning, setSpinning] = useState<boolean>(false)
  const [wind, setWind] = useState<IWind[]>([])
  const [list, setList] = useState<Database[]>([])
  const [table, setTable] = useState<TableDataMap>()
  const [visible, setVisible] = useState(false)
  const [editorData, setEditorData] = useState({
    type: EditorType.CREATE_DB,
    dbName: '',
    tableName: '',
    comment: '',
    charset: '',
    collation: '',
  })
  const [collapseActiveKey, setCollapseActiveKey] = useState<string[]>([])

  const collapseItems: CollapseProps['items'] = list.map(db => ({
    key: db.name,
    label: (
      <span className={styles.dbTitle}>
        <DBIcon style={{ width: '12px', paddingRight: '8px' }} />
        <EllipsisText text={db.name} width={150} />
      </span>
    ),
    children: (
      <List
        size='small'
        split={false}
        dataSource={table?.[db.name] || []}
        renderItem={(item) => (
          <List.Item className={styles.tableWrap}>
            <span
              className={classNames(
                styles.tableTitle,
                { [styles.active]: active === generateActiveId(db.name, item.name) }
              )}
              onClick={() => handleOpen(db.name, item.name)}
            >
              <TableIcon style={{ width: '14px', paddingRight: '8px' }} />
              <EllipsisText text={item.name} width={140} />
            </span>
            <span className={styles.handler}>
              <EditOutlined className={styles.icon} onClick={() => handleEditTable(db.name, item.name, item.comment)} />
              <Confirmation
                matchText={`${db.name}.${item.name}`}
                node={<DeleteOutlined className={styles.icon} />}
                onConfirm={() => handleDeleteTable(db.name, item.name)}
              />
            </span>
          </List.Item>
        )}
      />
    ),
    extra: (
      <div className={styles.handler}>
        <PlusOutlined className={styles.icon} onClick={(e) => handleCreateTable(e, db.name)} />
        <EditOutlined className={styles.icon} onClick={(e) => handleEditDatabase(e, db.name, db.charset, db.collation)} />
        <Confirmation
          matchText={db.name}
          node={<DeleteOutlined className={styles.icon} />}
          onConfirm={() => handleDeleteDatabase(db.name)}
        />
      </div>
    ),
    className: styles.collapseItem,
    showArrow: false,
  }))

  const handleCreateTable = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, dbName: string) => {
    event.stopPropagation()
    setEditorData({
      type: EditorType.CREATE_TABLE,
      dbName,
      tableName: '',
      comment: '',
      charset: '',
      collation: '',
    })
    setVisible(true)
  }

  const handleEditDatabase = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>, dbName: string, charset: string, collation: string) => {
    event.stopPropagation()
    setEditorData({
      type: EditorType.EDIT_DB,
      dbName,
      tableName: '',
      comment: '',
      charset,
      collation,
    })
    setVisible(true)
  }

  const handleDeleteDatabase = async (dbName: string) => {
    await deleteDB(connectionId, dbName)
    const omitPreDBWind = wind.filter(w => w.dbName !== dbName)
    setWind(omitPreDBWind)
    const activeId = generateActiveId(omitPreDBWind[0]?.dbName, omitPreDBWind[0]?.tableName)
    setActive(activeId)
    fetchDBList()
  }

  const handleCreateDatabase = () => {
    setEditorData({
      type: EditorType.CREATE_DB,
      dbName: '',
      tableName: '',
      comment: '',
      charset: '',
      collation: '',
    })

    setVisible(true)
  }

  const handleOpenShell = () => {
    window.open(`/shell/${connectionType}/${connectionId}`, '_blank')
  }

  const handleEditTable = (dbName: string, tableName: string, comment: string) => {
    setEditorData({
      type: EditorType.EDIT_TABLE,
      dbName,
      tableName,
      comment,
      charset: '',
      collation: '',
    })
    setVisible(true)
  }

  const handleDeleteTable = async (dbName: string, tableName: string) => {
    await deleteTable({ connectionId, dbName, tableName })
    const omitPreTableWind = wind.filter(w => !(w.tableName === tableName && w.dbName === dbName))
    setWind(omitPreTableWind)
    const activeId = generateActiveId(omitPreTableWind[0]?.dbName, omitPreTableWind[0]?.tableName)
    setActive(activeId)
    fetchTableList(dbName)
  }

  const handleAfterEditor = () => {
    if (editorData.type === EditorType.CREATE_DB) {
      fetchDBList()
    }
    if (editorData.type === EditorType.CREATE_TABLE) {
      fetchTableList(editorData.dbName)
    }
    if (editorData.type === EditorType.EDIT_TABLE) {
      const omitPreTableWind = wind.filter(w => !(w.tableName === editorData.tableName && w.dbName === editorData.dbName))
      setWind(omitPreTableWind)
      const activeId = generateActiveId(omitPreTableWind[0]?.dbName, omitPreTableWind[0]?.tableName)
      setActive(activeId)
      fetchTableList(editorData.dbName)
    }
    if (editorData.type === EditorType.EDIT_DB) {
      const omitPreDBWind = wind.filter(w => w.dbName !== editorData.dbName)
      setWind(omitPreDBWind)
      const activeId = generateActiveId(omitPreDBWind[0]?.dbName, omitPreDBWind[0]?.tableName)
      setActive(activeId)
      fetchDBList()
    }
    setVisible(false)
  }

  const fetchDBList = async () => {
    if (!connectionId) {
      return
    }

    setSpinning(true)
    const data = await getDBList(connectionId).finally(() => {
      setSpinning(false)
    })
    setList(data)
  }

  const handleOpen = (dbName: string, tableName?: string) => {
    const hasOpen = wind.find(p => p.dbName === dbName && p.tableName == tableName)
    setWind(hasOpen ? wind : [{ dbName, tableName }, ...wind])
    const activeId = generateActiveId(dbName, tableName)
    setActive(activeId)
  }

  const handleCollapse = (key: string[]) => {
    setCollapseActiveKey(key)

    if (key.length <= collapseActiveKey.length) {
      return
    }

    const name = key[key.length - 1]
    const hasFetch = table?.[name]
    const item = collapseItems.find(c => c.key === name)
    if (!item || hasFetch) {
      return
    }

    fetchTableList(name)
  }

  const fetchTableList = async (dbName: string) => {
    setSpinning(true)
    const data = await getTableList({ connectionId, dbName }).finally(() => {
      setSpinning(false)
    })

    setTable(t => ({
      ...t,
      [dbName]: data
    }))
  }

  useEffect(() => {
    fetchDBList()
  }, [])

  return (
    <div className={styles.wrap}>
      <DatabaseContext.Provider value={{ connectionId, connectionType, wind, setWind, active, setActive }}>
        <div className={styles.menu}>
          <div className={styles.buttonGroup}>
            {connectionType !== 'redis' && (
              <Button
                type="dashed"
                shape="round"
                icon={<PlusOutlined />}
                onClick={handleCreateDatabase}
              >
                {t('mysql.createDb')}
              </Button>
            )}
            <Button
              className={styles.shellBtn}
              block={connectionType === 'redis'}
              type="dashed"
              shape="round"
              icon={<ShellIcon className={styles.shell} />}
              onClick={handleOpenShell}
            >
              Shell
            </Button>
          </div>
          {
            connectionType === 'redis'
              ? <List
                split={false}
                dataSource={list}
                renderItem={(item) => (
                  <List.Item>
                    <span
                      className={classNames(
                        styles.redisTitle,
                        { [styles.active]: active === generateActiveId(item.name, undefined) }
                      )}
                      onClick={() => handleOpen(item.name, undefined)}
                    >
                      <DBIcon style={{ width: '12px', paddingRight: '8px' }} />
                      <span title={item.name}>{item.name}</span>
                    </span>
                  </List.Item>
                )}
              />
              : <Collapse
                ghost={true}
                activeKey={collapseActiveKey}
                onChange={handleCollapse}
                expandIconPosition='start'
                items={collapseItems}
              />
          }
        </div>
        <Editor
          visible={visible}
          type={editorData.type}
          connectionId={connectionId}
          dbName={editorData.dbName}
          tableName={editorData.tableName}
          comment={editorData.comment}
          charset={editorData.charset}
          collation={editorData.collation}
          onCancel={() => setVisible(false)}
          onOk={handleAfterEditor}
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </DatabaseContext.Provider>
      <Spin spinning={spinning} fullscreen size="large" />
    </div>
  )
}

export default MenuLayout