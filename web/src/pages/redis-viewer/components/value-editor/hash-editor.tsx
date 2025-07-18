import React from "react";
import { Input } from "antd";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'

interface HashValueItem {
  field?: string;
  value?: string;
}

interface HashEditorProps {
  value?: HashValueItem[];
  onChange?: (v: HashValueItem[]) => void;
}

const defaultValueItem: HashValueItem = { field: '', value: '' }

const HashEditor: React.FC<HashEditorProps> = ({ value = [defaultValueItem], onChange }) => {
  const handleChange = (index: number, type: 'field' | 'value', v: string) => {
    const current = { ...value[index], [type]: v }
    const newValue = [...value.slice(0, index), current, ...value.slice(index + 1)]
    onChange?.(newValue)
  }

  const handleAdd = () => {
    onChange?.([...value, defaultValueItem])
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
            {value.map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <Input
                    value={item.field}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'field', event.target.value)}
                    placeholder="Enter Field"
                  />
                </td>
                <td className={styles.td}>
                  <Input
                    value={item.value}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'value', event.target.value)}
                    placeholder="Enter Value"
                  />
                </td>
                <td className={classNames(styles.delete, styles.td)}>
                  <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
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
