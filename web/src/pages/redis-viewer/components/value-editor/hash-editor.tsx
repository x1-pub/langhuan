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
  onChange?: (v: HashValueItem[]) => void;
}

const defaultValueItem: HashValueItem = { field: '', value: '' }

const HashEditor: React.FC<HashEditorProps> = ({ value = [defaultValueItem], mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<HashValueItem[]>([]);

  // const handleChange = (index: number, type: 'field' | 'value', v: string) => {
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
                    value={item.field}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'field', event.target.value)}
                    placeholder="Enter Field"
                  /> */}
                  <EditableText readonly={mode === 'edit' && index < value.length} value={item.value} />
                </td>
                <td className={styles.td}>
                  {/* <Input
                    value={item.value}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'value', event.target.value)}
                    placeholder="Enter Value"
                  /> */}
                  <EditableText value={item.value} />
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

export default HashEditor
