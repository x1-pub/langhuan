import React, { useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'
import EditableText from "@/components/editable-text";

interface SetEditorProps {
  value?: string[];
  mode?: 'add' | 'edit';
  onChange?: (v: string[]) => void;
}

const SetEditor: React.FC<SetEditorProps> = ({ value = [''], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<string[]>([]);

  // const handleChange = (index: number, v: string) => {
  //   const newValue = [...value.slice(0, index), v, ...value.slice(index + 1)]
  //   onChange?.(newValue)
  // }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([...value, ''])
    } else {
      setAddItem([...addItem, ''])
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
                    value={item}
                    variant="borderless"
                    onChange={(event) => handleChange(index, event.target.value)}
                    placeholder="Enter Member"
                  /> */}
                  <EditableText readonly={mode === 'edit' && index < value.length} value={item} />
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

export default SetEditor
