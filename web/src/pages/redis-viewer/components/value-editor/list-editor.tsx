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
  onChange?: (v: ListValue) => void;
}

const defaultValue: ListValue = { pushToHead: false, elements: [''] }

const ListEditor: React.FC<ListEditorProps> = ({ value = defaultValue, mode = 'add', onChange }) => {
  const [addItem, setAddItem] = useState<ListValue['elements']>([]);

  // const handleChange = (index: number, v: string) => {
  //   const newValue = [...value.elements.slice(0, index), v, ...value.elements.slice(index + 1)]
  //   onChange?.({ pushToHead: value.pushToHead, elements: newValue })
  // }

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.({ pushToHead: value.pushToHead, elements: [...value.elements, ''] })
    } else {
      setAddItem([...addItem, ''])
    }
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
      {mode === 'add' && (
        <Select
          options={[
            { label: 'Push to tail', value: false },
            { label: 'Push to head', value: true },
          ]}
          value={value.pushToHead}
          onChange={(v: boolean) => onChange?.({ pushToHead: v, elements: value.elements })}
        />
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {[...value.elements, ...addItem].map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  {/* <Input
                    value={item}
                    variant="borderless"
                    onChange={(event) => handleChange(index, event.target.value)}
                    placeholder="Enter Element"
                  /> */}
                  <EditableText value={item} />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  {index < value.elements.length ? (
                    <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDelete(index)} />
                  ) : (
                    <Dropdown
                      menu={{
                        items: [
                          { key: '1', label: 'Push to tail' },
                          { key: '2', label: 'Push to head' },
                        ]
                      }}>
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
