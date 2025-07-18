import React from "react";
import { Input, InputNumber } from "antd";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'

interface ZSetValueItem {
  member?: string;
  score?: number;
}

interface ZSetEditorProps {
  value?: ZSetValueItem[];
  onChange?: (v: ZSetValueItem[]) => void;
}

const defaultValueItem: ZSetValueItem = { member: '', score: undefined }

const ZSetEditor: React.FC<ZSetEditorProps> = ({ value = [defaultValueItem], onChange }) => {
  const handleChange = (index: number, type: 'member' | 'score', v?: string | number | null) => {
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
                    value={item.member}
                    variant="borderless"
                    onChange={(event) => handleChange(index, 'member', event.target.value)}
                    placeholder="Enter Member"
                  />
                </td>
                <td className={styles.td}>
                  <InputNumber
                    value={item.score}
                    variant="borderless"
                    onChange={(v) => handleChange(index, 'score', v)}
                    placeholder="Enter Score*"
                    style={{ width: '100%' }}
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

export default ZSetEditor
