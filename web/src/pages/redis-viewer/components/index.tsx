import React, { useEffect, useMemo, useState } from 'react'
import useMain from "@/utils/use-main"
import { Splitter, Input, Select, Button, Table, type TableProps, Segmented, Tooltip } from "antd"
import { useTranslation } from "react-i18next";
import {
  BarsOutlined,
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  NodeExpandOutlined,
  ReloadOutlined,
  RightOutlined
} from '@ant-design/icons';

import { getRedisKeys, type RedisKeyItem, type RedisValueRsp, RedisType, getRedisValue } from '@/api/redis';
import KeyTypeIcon from './key-type-icon'
import styles from './index.module.less'
import { SearchProps } from 'antd/es/input';
import AddKeyBox from './add-key-box';
import EditKeyBox from './edit-key-box';
import formatSeconds from '@/utils/format-second';
import useNotification from '@/utils/use-notifition';
import redisListToTree, { TreeNode } from '@/utils/redis-list-to-tree';
import useElementSize from '../hooks/use-element-size';

const RedisMain: React.FC = () => {
  const { connectionId, dbName } = useMain()
  const { t } = useTranslation()
  const notify = useNotification()
  const { width, height } = useElementSize('redis-keys-wrap-table')
  const [keysData, setKeysData] = useState<RedisKeyItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [scanned, setScanned] = useState<number>(0)
  const [cursor, setCursor] = useState<string>()
  const [match, setMatch] = useState<string>()
  const [type, setType] = useState<RedisType | ''>('')
  const [activevalue, setActiveValue] = useState<RedisValueRsp>()
  const [showAddBox, setShowAddBox] = useState<boolean>(false)
  const [showEditBox, setShowEditBox] = useState<boolean>(false)
  const [tableType, setTableType] = useState<'list' | 'tree'>('list')

  const columns: TableProps<TreeNode>['columns'] = [
    {
      title: 'type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => {
        if (!record.isLeaf) {
          return record.name
        }
        return (
          <>
            <KeyTypeIcon type={type} />
            <span style={{ paddingLeft: '5px' }}>{record.name}</span>
          </>
        )
      },
      align: 'left',
      ellipsis: true,
    },
    {
      title: 'ttl',
      dataIndex: 'ttl',
      key: 'ttl',
      render: (ttl, record) => {
        return record.isLeaf ? formatSeconds(ttl) : null
      },
      align: 'right',
      width: 100,
      ellipsis: true,
    },
  ]

  const tableData: TreeNode[] = useMemo(() => {
    return redisListToTree(keysData, tableType)
  }, [keysData, tableType])

  const getKeysData = async (research: boolean = false, defaultMatch?: string, defaulType?: RedisType | '', defaultTableType?: 'list' | 'tree') => {
    const { cursor: nextCursor, list, total, scanned: currScanned } = await getRedisKeys({
      connectionId,
      dbName,
      cursor: research ? '0' : (cursor || '0'),
      match: defaultMatch ?? match,
      type: defaulType ?? type,
      count: (defaultTableType || tableType) === 'list' ? 500 : 10000,
    })
    setScanned(research ? currScanned : Math.min(currScanned + scanned, total))
    setTotal(total)
    setCursor(nextCursor)
    setKeysData(research ? list : [...keysData, ...list])
  }

  const handleSearch: SearchProps['onSearch'] = async (match: string, _event, info) => {
    if (info?.source == 'clear') {
      setMatch(undefined)
      setType('')
      getKeysData(true, '', '')
      return
    }
    if (info?.source === "input") {
      setMatch(match)
      getKeysData(true, match)
    }
  }

  const handleTypeChange = async (type: RedisType | '') => {
    setType(type)
    getKeysData(true, match, type)
  }

  const handleAddSuccess = () => {
    setShowAddBox(false)
    getKeysData(true)
  }

  const handleDelete = () => {
    setShowEditBox(false)
    getKeysData(true)
  }

  const handleEditCancel = () => {
    setActiveValue(undefined)
    setShowEditBox(false)
  }

  const handleKeyReload = async (key?: string) => {
    const data = await getRedisValue({ connectionId, dbName, type: activevalue!.type, key: key || activevalue!.key })
    if (data.ttl === -2) {
      setActiveValue(undefined)
      setShowEditBox(false)
      getKeysData(true)
      notify.error({
        message: '失败',
        description: <span style={{ whiteSpace: 'pre-wrap' }}>不存在的key</span>,
        duration: null,
      })
      return
    }
    setActiveValue(data)
  }

  const handleRowClick = async (record: TreeNode) => {
    if (!record.isLeaf && tableType === 'tree') {
      return
    }
    setShowAddBox(false)
    const data = await getRedisValue({ connectionId, dbName, type: record.type, key: record.key })
    setActiveValue(data)
    setShowEditBox(true)
  }

  const handleAddKey = () => {
    setShowEditBox(false)
    setShowAddBox(true)
  }

  const handleTableTypeChange = async (v: 'list' | 'tree') => {
    setTableType(v)
    getKeysData(true, match, type, v)
  }

  useEffect(() => {
    getKeysData()
  }, [])

  return (
    <div className={styles.redisWrap}>
      <div className={styles.searchGroup}>
        <Input.Search
          addonBefore={(
            <Select value={type} style={{ width: '180px' }} onChange={handleTypeChange}>
              <Select.Option value="">
                <div style={{ width: '100%', textAlign: 'center' }}>All Key Types</div>
              </Select.Option>
              {Object.values(RedisType).map(key => (
                <Select.Option value={key} key={key}>
                  <div style={{ width: '100%', textAlign: 'center' }}><KeyTypeIcon type={key} /></div>
                </Select.Option>
              ))}
            </Select>
          )}
          allowClear={true}
          placeholder={t('redis.placeholderRedisSearch')}
          onSearch={handleSearch}
        />
        <Button type="primary" onClick={handleAddKey}>+ Key</Button>
      </div>

      <Splitter className={styles.data}>
        <Splitter.Panel collapsible={true} min={480}>
          <div className={styles.content}>
            <div className={styles.left}>
              <span>Results: {keysData.length}</span>
              <span>Scanned: {scanned} / {total}</span>
              {cursor !== '0' && (
                <Button
                  size='small'
                  icon={
                    <Tooltip title="Scanning additional keys may decrease performance and memory available.">
                      <InfoCircleOutlined />
                    </Tooltip>
                  }
                  onClick={() => getKeysData()}
                >More</Button>
              )}
            </div>
            <div className={styles.right}>
              <ReloadOutlined style={{ cursor: 'pointer' }} onClick={() => getKeysData(true)} />
              <Segmented
                size="small"
                shape="round"
                options={[
                  { value: 'list', icon: <BarsOutlined /> },
                  { value: 'tree', icon: <NodeExpandOutlined /> },
                ]}
                value={tableType}
                onChange={handleTableTypeChange}
              />
            </div>
          </div>
          <div className={styles.redisKeys} id='redis-keys-wrap-table'>
            {keysData.length > 0 && (
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                showHeader={false}
                onRow={(record: TreeNode) => ({
                  onClick: () => handleRowClick(record)
                })}
                rowClassName={(record: TreeNode) => {
                  return record.key === activevalue?.key ? styles.avtiveRow : ''
                }}
                size="small"
                tableLayout="fixed"
                rowHoverable={true}
                expandable={{
                  indentSize: 5,
                  expandRowByClick: true,
                  showExpandColumn: tableType === 'tree',
                  expandIcon: ({ expanded, onExpand, record }) => {
                    if (record.isLeaf) {
                      return null
                    }
                    return expanded ? (
                      <span>
                        <DownOutlined className={styles.expandIconLeft} onClick={e => onExpand(record, e)} />
                        <FolderOpenOutlined className={styles.expandIconRight} />
                      </span>
                    ) : (
                      <span>
                        <RightOutlined className={styles.expandIconLeft} onClick={e => onExpand(record, e)} />
                        <FolderOutlined className={styles.expandIconRight} />
                      </span>
                    )
                  }
                }}
                scroll={{ x: width, y: height }}
                virtual={true}
              />
            )}
          </div>
        </Splitter.Panel>

        <Splitter.Panel collapsible={true} min={420}>
          <div className={styles.redisValue}>
            {showAddBox && (
              <AddKeyBox onAddSuccess={handleAddSuccess} onCancel={() => setShowAddBox(false)} />
            )}
            {showEditBox && activevalue && (
              <EditKeyBox data={activevalue} onDelete={handleDelete} onCancel={handleEditCancel} onReload={handleKeyReload} />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  )
}

export default RedisMain