import React, { useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'
import EditableText from "@/components/editable-text";

interface SetEditorProps {
  value?: string[];
  mode?: 'add' | 'edit';
  onChange?: (v: unknown) => void;
}

const SetEditor: React.FC<SetEditorProps> = ({ value = [''], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<string[]>([]);

  const handleChange = (index: number, v: string) => {
    if (mode === 'add') {
      const newValue = [...value.slice(0, index), v, ...value.slice(index + 1)]
      onChange?.(newValue)
    } else {
      const idx = index - value.length
      setAddItem([...addItem.slice(0, idx), v, ...addItem.slice(idx + 1)])
    }
  }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([...value, ''])
    } else {
      setAddItem([...addItem, ''])
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
      onChange?.({ remove: value[index] })
    }
  }

  const handleSaveItem = (index: number) => {
    const idx = index - value.length
    onChange?.({ save: addItem[idx] })
    setAddItem([...addItem.slice(0, idx), ...addItem.slice(idx + 1)])
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {[...value, ...addItem].map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  {/* <Input
                    value={item}
                    variant="borderless"
                    onChange={(event) => handleChange(index, event.target.value)}
                    placeholder="Enter Member"
                  /> */}
                  <EditableText
                    readonly={mode === 'edit' && index < value.length}
                    value={item}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={(v) => handleChange(index, v)}
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

export default SetEditor
