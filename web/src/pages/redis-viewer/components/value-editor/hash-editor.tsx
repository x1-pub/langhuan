import React, { useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import EditableText from "@/components/editable-text";
import styles from './index.module.less'

interface HashValueItem {
  field?: string;
  value?: string;
}

interface HashEditorProps {
  value?: HashValueItem[];
  mode?: 'add' | 'edit';
  onChange?: (v: unknown) => void;
}

const defaultValueItem: HashValueItem = { field: '', value: '' }

const HashEditor: React.FC<HashEditorProps> = ({ value = [defaultValueItem], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<HashValueItem[]>([]);

  const handleChange = (index: number, type: 'field' | 'value', v: string) => {
    if (mode === 'add') {
      const current = { ...value[index], [type]: v }
      const newValue = [...value.slice(0, index), current, ...value.slice(index + 1)]
      onChange?.(newValue)
    } else {
      if (index < value.length) {
        onChange?.({
          modify: {
            field: value[index].field,
            value: v,
          }
        })
      } else {
        const idx = index - value.length
        setAddItem([...addItem.slice(0, idx), { ...addItem[idx], [type]: v }, ...addItem.slice(idx + 1)])
      }
    }
  }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([...value, defaultValueItem])
    } else {
      setAddItem([...addItem, defaultValueItem])
    }
  }

  const handleDelete = (index: number) => {
    if (mode === 'add') {
      if (value.length === 1) {
        return
      }
      const newValue = [...value.slice(0, index), ...value.slice(index + 1)]
      onChange?.(newValue)
    } else {
      onChange?.({ remove: value[index].field })
    }
  }

  const handleSaveItem = (index: number) => {
    const idx = index - value.length
    onChange?.({
      save: { ...addItem[idx] }
    })
    setAddItem([...addItem.slice(0, idx), ...addItem.slice(idx + 1)])
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {[...value, ...addItem].map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td} style={{ width: '30%' }}>
                  <EditableText
                    readonly={mode === 'edit' && index < value.length}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    value={item.field}
                    onChange={v => handleChange(index, 'field', v)}
                  />
                </td>
                <td className={styles.td}>
                  <EditableText
                    value={item.value}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={v => handleChange(index, 'value', v)}
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  {index < value.length ? (
                    <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                  ) : (
                    <SaveOutlined style={{ cursor: 'pointer' }} onClick={() => handleSaveItem(index)} />
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

export default HashEditor
