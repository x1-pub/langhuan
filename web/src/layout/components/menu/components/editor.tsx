import React, { useEffect } from "react";
import { Col, Form, Input, Modal, Row } from "antd";
import { useTranslation } from "react-i18next";

import { createTable, modifyTable } from "@/api/table";
import { createDB, modifyDB } from "@/api/database";
import useNotification from "@/utils/use-notifition";

export enum EditorType {
  CREATE_TABLE = 0,
  EDIT_TABLE = 1,
  CREATE_DB = 2,
  EDIT_DB = 3,
}

interface FormConfig {
  name: string;
  comment?: string;
  charset?: string;
  collation?: string;
}

interface EditorProps {
  type: EditorType;
  connectionId: string;
  dbName?: string;
  tableName?: string;
  comment?: string;
  charset?: string;
  collation?: string;
  visible: boolean;
  onOk?: () => void;
  onCancel?: () => void;
}

const Editor: React.FC<EditorProps> = (props) => {
  const { type, connectionId, dbName, tableName, comment, charset, collation, visible, onOk, onCancel } = props
  const { t } = useTranslation()
  const notify = useNotification()
  const [form] = Form.useForm<FormConfig>();
  const defaultName =
    [EditorType.CREATE_TABLE, EditorType.CREATE_DB].includes(type) ? undefined :
    type === EditorType.EDIT_DB ? dbName : tableName
  const modalTitleMap = {
    [EditorType.CREATE_DB]: t('mysql.createDb'),
    [EditorType.CREATE_TABLE]: t('mysql.createTable'),
    [EditorType.EDIT_DB]: t('mysql.editDb'),
    [EditorType.EDIT_TABLE]: t('mysql.editTable'),
  }

  const handleSubmit = async () => {
    const { name, comment, charset, collation } = await form.validateFields();
    try {
      if (type === EditorType.CREATE_TABLE && dbName) {
        await createTable({ connectionId, dbName, tableName: name, comment })
      }
      if (type === EditorType.EDIT_TABLE && dbName && tableName) {
        await modifyTable({ connectionId, dbName, tableName, newTableName: name, comment })
      }
      if (type === EditorType.CREATE_DB) {
        await createDB({ connectionId, dbName: name, charset, collation })
      }
      if (type === EditorType.EDIT_DB) {
        await modifyDB({ connectionId, dbName: name, charset, collation })
      }

      onOk?.()
    } catch (err) {
      notify.error({
        message: t('执行失败'),
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
        duration: null,
      })
    }
  }

  useEffect(() => {
    if (visible) {
      form?.setFieldsValue({
        name: defaultName,
        comment,
        charset,
        collation,
      })
    }
  }, [visible])

  return (
    <Modal
      title={modalTitleMap[type]}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      destroyOnClose
      width={600}
      afterClose={() => form?.resetFields()}
    >
      <Form
        style={{ paddingTop: '10px' }}
        layout="vertical"
        form={form}
        initialValues={{ name: defaultName }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="名字"
              name="name"
              rules={[{ required: true, message: '请输入字段名称' }]}
            >
              <Input disabled={type === EditorType.EDIT_DB} autoComplete='off' />
            </Form.Item>
          </Col>
        </Row>
        {[EditorType.CREATE_TABLE, EditorType.EDIT_TABLE].includes(type) && (          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="备注"
                name="comment"
              >
                <Input autoComplete='off' />
              </Form.Item>
            </Col>
          </Row>
        )}
        {[EditorType.CREATE_DB, EditorType.EDIT_DB].includes(type) && (          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="字符集"
                name="charset"
              >
                <Input autoComplete='off' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="排序规则"
                name="collation"
              >
                <Input autoComplete='off' />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  )
}

export default Editor