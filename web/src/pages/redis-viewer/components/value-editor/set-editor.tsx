import React from "react";
import { Input } from "antd";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'

interface SetEditorProps {
  value?: string[];
  onChange?: (v: string[]) => void;
}

const SetEditor: React.FC<SetEditorProps> = ({ value = [''], onChange }) => {
  const handleChange = (index: number, v: string) => {
    const newValue = [...value.slice(0, index), v, ...value.slice(index + 1)]
    onChange?.(newValue)
  }

  const handleAdd = () => {
    onChange?.([...value, ''])
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
                    value={item}
                    variant="borderless"
                    onChange={(event) => handleChange(index, event.target.value)}
                    placeholder="Enter Member"
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

export default SetEditor
