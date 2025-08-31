import React, { useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'
import EditableText from "@/components/editable-text";

interface ZSetValueItem {
  member?: string;
  score?: number;
}

interface ZSetEditorProps {
  value?: ZSetValueItem[];
  mode?: 'add' | 'edit';
  onChange?: (v: ZSetValueItem[]) => void;
}

const defaultValueItem: ZSetValueItem = { member: '', score: undefined }

const ZSetEditor: React.FC<ZSetEditorProps> = ({ value = [defaultValueItem], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<ZSetValueItem[]>([]);

  // const handleChange = (index: number, type: 'member' | 'score', v?: string | number | null) => {
  //   const current = { ...value[index], [type]: v }
  //   const newValue = [...value.slice(0, index), current, ...value.slice(index + 1)]
  //   onChange?.(newValue)
  // }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([...value, defaultValueItem])
    } else {
      setAddItem([...addItem, defaultValueItem])
    }
  }

  const handleDelete = (index: number) => {
    if (value.length === 1) {
      return
    }
    const newValue = [...value.slice(0, index), ...value.slice(index + 1)]
    onChange?.(newValue)
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
                    value={item.member}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'member', event.target.value)}
                    placeholder="Enter Member"
                  /> */}
                  <EditableText readonly={mode === 'edit' && index < value.length} value={item.member} />
                </td>
                <td className={styles.td} style={{ width: '30%' }}>
                  {/* <InputNumber
                    value={item.score}
                    variant="borderless"
                    onChange={(v) => handleChange(index, 'score', v)}
                    placeholder="Enter Score*"
                    style={{ width: '100%' }}
                  /> */}
                  <EditableText value={item.score !== undefined ? String(item.score) : ''} placeholder="Enter Score*" />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  {index < value.length ? (
                    <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                  ) : (
                    <SaveOutlined style={{ cursor: 'pointer' }} />
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

export default ZSetEditor
