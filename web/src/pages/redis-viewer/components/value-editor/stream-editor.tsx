import React, { useMemo, useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import EditableText from "@/components/editable-text";
import styles from './index.module.less'
import { Divider, Input } from "antd";

type StreamValueItem = [string, string[]]

interface StreamEditorProps {
  value?: StreamValueItem[];
  mode?: 'add' | 'edit';
  onChange?: (v: StreamValueItem[]) => void;
}

const defaultValueItem: StreamValueItem = ['*', ['', '']]
const ENTRY_ID_KEY = 'langhuan_redis_stream_entry_id_key_9g8nxoa04lac724nsdfg-0'

const StreamEditor: React.FC<StreamEditorProps> = ({ value = [defaultValueItem], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<StreamValueItem>()

  const columnKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < value.length; i++) {
      const item = value[i][1]
      for (let j = 0; j < item.length; j += 2) {
        keys.add(item[j])
      }
    }
    return Array.from(keys)
  }, [value])

  const formattedData = useMemo(() => {
    return value.map(([id, values]) => {
      const rowData: Record<string, string> = { [ENTRY_ID_KEY]: id };

      for (let i = 0; i < values.length; i += 2) {
        const key = values[i];
        const value = values[i + 1] || '';
        if (key) rowData[key] = value;
      }

      return rowData;
    });
  }, [value]);

  const idStatus = useMemo(() => {
    const id = addItem ? addItem[0] : value[0][0]
    return !id || (id !== "*" && !/^\d{13}-\d+$/.test(id)) ? 'error' : ''
  }, [value, addItem])

  // const 
  // const [addItem, setAddItem] = useState<StreamValueItem['value']>();
  // const idStatus = !value.id || (value.id !== "*" && !/^\d{13}-\d+$/.test(value.id)) ? 'error' : ''

  const handleChange = (index: number, v: string) => {
    if (mode === 'add') {
      onChange?.([[value[0][0], [...value[0][1].slice(0, index), v, ...value[0][1].slice(index + 1)]]])
    } else {
      if (!addItem) {
        return
      }

      setAddItem([addItem[0], [...addItem[1].slice(0, index), v, ...addItem[1].slice(index + 1)]])
    }
    // console.log(index, field)
    // const fields = [...value.fields.slice(0, index), field, ...value.fields.slice(index + 1)]
    // onChange?.({ id: value.id, fields })
  }

  // const handleIdChange = (id: string) => {
  //   setId(id)
  //   if (!id || (id !== "*" && !/^\d{13}-\d+$/.test(id))) {
  //     return setIdStatus('error')
  //   }
  //   setIdStatus('')
  // }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([[value[0][0], [...value[0][1], '', '']]])
    } else {
      if (!addItem) {
        setAddItem(defaultValueItem)
      } else {
        setAddItem([addItem[0], [...addItem[1], '', '']])
      }
      // setAddItem([...addItem, ...defaultValueItem.fields])
    }
  }

  const handleDelete = (index: number) => {
    if (mode === 'add') {
      if (value[0][1].length === 2) {
        return
      }

      const newValue = [...value[0][1].slice(0, index), ...value[0][1].slice((index + 2))]
      onChange?.([[value[0][0], newValue]])

      return
    }
    // if (value.fields.length === 1) {
    //   return
    // }
    // const fields = [...value.fields.slice(0, index), ...value.fields.slice(index + 1)]
    // onChange?.({ id: value.id, fields })
  }

  return (
    <>
      {mode === 'add' && (
        <div style={{ marginBottom: '10px' }}>
          Entry ID*
          <Input
            value={value[0][0]}
            onChange={e => onChange?.([[e.target.value, value[0][1]]])}
            status={idStatus}
          />
          <span style={{
            fontSize: '12px',
            color: idStatus === 'error' ? '#F0685F' : undefined,
          }}>
            Timestamp - Sequence Number or *
          </span>
        </div>
      )}
      <div className={styles.tableWrap}>
        {mode === 'add' && (
          <table className={styles.table}>
            <tbody>
              {value[0][1].map((_, index) => {
                const row = value[0][1]
                if (index % 2 === 0) {
                  return (
                    <tr key={index} className={styles.tr}>
                      <td className={styles.td} style={{ width: '30%' }}>
                        <EditableText editMode='fastify' value={row[index]} onChange={v => handleChange(index, v)} />
                      </td>
                      <td className={styles.td}>
                        <EditableText editMode='fastify' value={row[index + 1]} onChange={v => handleChange(index + 1, v)} />
                      </td>
                      <td className={classNames(styles.handler, styles.td)}>
                        <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                      </td>
                    </tr>
                  )
                }
                return null
              })}
            </tbody>
          </table>
        )}
        {mode === 'edit' && (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tr}>
                <td className={styles.td}>Entry ID</td>
                {columnKeys.map(field => (
                  <td className={styles.td}>{field}</td>
                ))}
                <td className={styles.td}></td>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((row, index) => (
                <tr key={index} className={styles.tr}>
                  <td className={styles.td}>
                    <EditableText readonly value={row[ENTRY_ID_KEY]} />
                  </td>
                  {columnKeys.map(key => (
                    <td className={styles.td}>
                      <EditableText readonly value={row[key]} />
                    </td>
                  ))}
                  <td className={classNames(styles.handler, styles.td)}>
                    <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {addItem && (
        <>
          <Divider className={styles.divider} />
          <div style={{ marginBottom: '10px' }}>
            Entry ID*
            <Input
              value={addItem[0]}
              onChange={e => setAddItem([e.target.value, addItem[1]])}
              status={idStatus}
            />
            <span style={{
              fontSize: '12px',
              color: idStatus === 'error' ? '#F0685F' : undefined,
            }}>
              Timestamp - Sequence Number or *
            </span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {addItem[1].map((_, index) => {
                  const row = addItem[1]
                  if (index % 2 === 0) {
                    return (
                      <tr key={index} className={styles.tr}>
                        <td className={styles.td} style={{ width: '30%' }}>
                          <EditableText editMode='fastify' value={row[index]} onChange={v => handleChange(index, v)} />
                        </td>
                        <td className={styles.td}>
                          <EditableText editMode='fastify' value={row[index + 1]} onChange={v => handleChange(index + 1, v)} />
                        </td>
                        <td className={classNames(styles.handler, styles.td)}>
                          <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                        </td>
                      </tr>
                    )
                  }
                  return null
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className={styles.add}>
        {addItem && <SaveOutlined style={{ cursor: 'pointer' }} />}
        <PlusCircleOutlined onClick={handleAdd} />
      </div>
    </>
  )
}

export default StreamEditor
