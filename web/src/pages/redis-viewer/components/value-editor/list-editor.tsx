import React, { useState } from "react";
import { Dropdown, Select } from "antd";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'
import EditableText from "@/components/editable-text";

interface ListValue {
  pushToHead?: boolean;
  elements: string[];
}

interface ListEditorProps {
  value?: ListValue;
  mode?: 'add' | 'edit';
  onChange?: (v: unknown) => void;
}

const defaultValue: ListValue = { pushToHead: false, elements: [''] }

const ListEditor: React.FC<ListEditorProps> = ({ value = defaultValue, mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<ListValue['elements']>([]);

  const handleChange = (index: number, v: string) => {
    if (mode === 'add') {
      const newValue = [...value.elements.slice(0, index), v, ...value.elements.slice(index + 1)]
      onChange?.({ pushToHead: value.pushToHead, elements: newValue })
      return
    }
    if (index < value.elements.length) {
      onChange?.({ modify: { index, value: v } })
      return
    }
    const idx = index - value.elements.length
    setAddItem([...addItem.slice(0, idx), v, ...addItem.slice(idx + 1)])
  }

  const handlePushValue = (index: number, pushToHead: boolean) => {
    const idx = index - value.elements.length
    onChange?.({ save: { pushToHead, value: addItem[idx] } })
    setAddItem([...addItem.slice(0, idx), ...addItem.slice(idx + 1)])
  }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.({ pushToHead: value.pushToHead, elements: [...value.elements, ''] })
    } else {
      setAddItem([...addItem, ''])
    }
  }

  const handleDelete = (index: number) => {
    if (mode === 'add') {
      if (value.elements.length === 1) {
        return
      }
      const newValue = [...value.elements.slice(0, index), ...value.elements.slice(index + 1)]
      onChange?.({ pushToHead: value.pushToHead, elements: newValue })
      return
    }

    onChange?.({ remove: value.elements[index] })
  }

  return (
    <>
      {mode === 'add' && (
        <Select
          options={[
            { label: 'Push to tail', value: false },
            { label: 'Push to head', value: true },
          ]}
          value={value.pushToHead}
          onChange={(v: boolean) => onChange?.({ pushToHead: v, elements: value.elements })}
          style={{ marginBottom: '10px' }}
        />
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {[...value.elements, ...addItem].map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <EditableText
                    value={item}
                    onChange={value => handleChange(index, value)}
                    editMode={mode === 'add' || index >= value.elements.length ? 'fastify' : 'normal'}
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  {index < value.elements.length ? (
                    <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                  ) : (
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Push to tail', onClick: () => handlePushValue(index, false) },
                          { key: '2', label: 'Push to head', onClick: () => handlePushValue(index, true) },
                        ]
                      }}
                    >
                      <SaveOutlined style={{ cursor: 'pointer' }} />
                    </Dropdown>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.add}>
        <PlusCircleOutlined onClick={handleAdd} />
      </div>
    </>
  )
}

export default ListEditor
