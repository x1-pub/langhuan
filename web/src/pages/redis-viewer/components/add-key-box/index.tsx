import React from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Form, Input, InputNumber, Row, Select } from "antd";

import { addRedisValue, RedisType } from "@/api/redis";
import KeyTypeIcon from "../key-type-icon";
import ValueEditor from "../value-editor";
import useMain from "@/utils/use-main";
import useNotification from "@/utils/use-notifition.tsx";
import styles from './index.module.less'

type FieldType = {
  type: RedisType;
  ttl: number;
  key: string;
  value: string;
}

interface AddKeyBoxProps {
  onAddSuccess?: () => void;
  onCancel?: () => void;
}

const AddKeyBox: React.FC<AddKeyBoxProps> = ({ onAddSuccess, onCancel }) => {
  const { connectionId, dbName } = useMain()
  const notify = useNotification()
  const [form] = Form.useForm<FieldType>()

  const typeValue = Form.useWatch('type', form)

  const handleSubmit = async () => {
    await form.validateFields()
    const formData = form.getFieldsValue()
    await addRedisValue({ connectionId, dbName, ...formData }).catch(err => {
      notify.error({
        message: '添加失败',
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
        duration: null,
      })
      return Promise.reject()
    })
    onAddSuccess?.()
  }

  return (
    <div className={styles.addBoxWrap}>
      <div>
        <div className={styles.addBoxheader}>
          <span>New Key</span>
          <CloseOutlined style={{ cursor: 'pointer' }} onClick={onCancel} />
        </div>
        <Divider className={styles.divider} />
      </div>

      <div className={styles.addBoxMain}>
        <Form
          autoComplete="off"
          layout="vertical"
          form={form}
          initialValues={{ type: RedisType.HASH }}
        >
          <Row gutter={10}>
            <Col span={12}>
              <Form.Item<FieldType>
                label="Key Type"
                name="type"
                rules={[{ required: true }]}
              >
                <Select onChange={() => form.setFieldValue('value', undefined)}>
                  {Object.values(RedisType).map(key => (
                    <Select.Option value={key} key={key}>
                      <KeyTypeIcon type={key} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item<FieldType>
                label="TTL"
                name="ttl"
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item<FieldType>
            label="Key Name"
            name="key"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Divider className={styles.divider} />
          <Form.Item<FieldType>
            label="Value"
            name="value"
          >
            <ValueEditor type={typeValue} />
          </Form.Item>
        </Form>
      </div>
      
      <div>
        <Divider className={styles.divider} />
        <div className={styles.addBoxfooter}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>Add Key</Button>
        </div>
      </div>

    </div>
  )
}

export default AddKeyBox
