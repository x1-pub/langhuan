import React from "react";
import { Input, Select } from "antd";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from './index.module.less'

interface ListValue {
  pushToHead?: boolean;
  elements: string[];
}

interface ListEditorProps {
  value?: ListValue;
  onChange?: (v: ListValue) => void;
}

const defaultValue: ListValue = { pushToHead: false, elements: [''] }

const ListEditor: React.FC<ListEditorProps> = ({ value = defaultValue, onChange }) => {
  const handleChange = (index: number, v: string) => {
    const newValue = [...value.elements.slice(0, index), v, ...value.elements.slice(index + 1)]
    onChange?.({ pushToHead: value.pushToHead, elements: newValue })
  }

  const handleAdd = () => {
    onChange?.({ pushToHead: value.pushToHead, elements: [...value.elements, ''] })
  }

  const handleDelete = (index: number) => {
    if (value.elements.length === 1) {
      return
    }
    const newValue = [...value.elements.slice(0, index), ...value.elements.slice(index + 1)]
    onChange?.({ pushToHead: value.pushToHead, elements: newValue })
  }

  return (
    <>
      <Select
        options={[
          { label: 'Push to tail', value: false },
          { label: 'Push to head', value: true },
        ]}
        value={value.pushToHead}
        onChange={(v: boolean) => onChange?.({ pushToHead: v, elements: value.elements })}
      />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {value.elements.map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <Input
                    value={item}
                    variant="borderless"
                    onChange={(event) => handleChange(index, event.target.value)}
                    placeholder="Enter Element"
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

export default ListEditor
