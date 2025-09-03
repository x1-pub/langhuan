import React, { useState } from "react";
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

import styles from './index.module.less'
import EditableText from "@/components/editable-text";

interface ZSetValueItem {
  member?: string;
  score?: number;
}

interface ZSetEditorProps {
  value?: ZSetValueItem[];
  mode?: 'add' | 'edit';
  onChange?: (v: unknown) => void;
}

const defaultValueItem: ZSetValueItem = { member: '', score: undefined }

const ZSetEditor: React.FC<ZSetEditorProps> = ({ value = [defaultValueItem], mode = 'add', onChange }) => {
  const { t } = useTranslation()
  const [addItem, setAddItem] = useState<ZSetValueItem[]>([]);

  const handleChange = (index: number, type: 'member' | 'score', v?: string) => {
    if (mode === 'add') {
      const current = { ...value[index], [type]: v }
      const newValue = [...value.slice(0, index), current, ...value.slice(index + 1)]
      onChange?.(newValue)
    } else {
      if (index >= value.length) {
        const idx = index - value.length
        setAddItem([...addItem.slice(0, idx), { ...addItem[idx], [type]: v }, ...addItem.slice(idx + 1)])
      } else {
        onChange?.({ modify: { score: v, member: value[index].member } })
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
      onChange?.({ remove: value[index].member })
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
                  <EditableText
                    readonly={mode === 'edit' && index < value.length}
                    value={item.member}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={(v) => handleChange(index, 'member', v)}
                    empty={index >= value.length || mode === 'add' ? t('redis.member') : t('redis.empty')}
                  />
                </td>
                <td className={styles.td} style={{ width: '30%' }}>
                  <EditableText
                    value={item.score !== undefined ? String(item.score) : ''}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={(v) => handleChange(index, 'score', v)}
                    empty={t('redis.score')}
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  {index < value.length ? (
                    <DeleteOutlined className={styles.delIcon} onClick={() => handleDelete(index)} />
                  ) : (
                    <SaveOutlined className={styles.icon} onClick={() => handleSaveItem(index)} />
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
