import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Row, Col, Button } from "antd";
import { useTranslation } from "react-i18next";

import { showSuccess } from "@/utils/use-notifition.tsx";
import { connectionTypeOptions } from './constants'
import { getConnectionDetails, testConnection, type CreateConnectionParams } from "@/api/connection";

interface IConnectionModal {
  disabled?: boolean;
  open: boolean;
  id?: string | number;
  loading?: boolean;
  onCancel?: () => void;
  onOk?: (vals: CreateConnectionParams) => void;
}

const ConnectionModal: React.FC<IConnectionModal> = (props) => {
  const { disabled, open, id, loading, onOk, onCancel } = props
  const [testLoading, setTestLoading] = useState(false)
  const { t } = useTranslation()
  const [form] = Form.useForm<CreateConnectionParams>();
  const connectionType = Form.useWatch('type', form)
  const title = t(`button.${id ? 'update' : 'add'}`)

  const handleOk = async () => {
    const values = await form.validateFields()
    onOk?.(values)
  }

  const handleTest = async () => {
    const values = await form.validateFields()
    setTestLoading(true)
    testConnection({ ...values, id })
      .then(() => {
        showSuccess(t('connection.success'))
      })
      .finally(() => {
        setTestLoading(false)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel?.()
  }

  const clearForm = () => {
    form.resetFields()
  }

  const getData = async () => {
    const data = await getConnectionDetails(id!)
    form.setFieldsValue(data)
  }

  useEffect(() => {
    if (!id) {
      return
    }

    getData()
  }, [id])

  return (
    <Modal
      width={800}
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      afterClose={clearForm}
      footer={(_, { CancelBtn }) => (
        <>
          <Button loading={testLoading} type="dashed" style={{ float: 'left' }} onClick={handleTest}>{t('connection.test')}</Button>
          <CancelBtn />
          <Button key="submit" type="primary" loading={loading} onClick={handleOk}>OK</Button>
        </>
      )}
    >
      <Form
        style={{ paddingTop: '10px' }}
        form={form}
        disabled={disabled}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('connection.type')}
              name="type"
              rules={[{ required: true }]}
            >
              <Select options={connectionTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('connection.name')}
              name="name"
              rules={[{ required: true }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('connection.host')}
              name="host"
              rules={[{ required: true }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('connection.port')}
              name="port"
              rules={[{ required: true }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('connection.username')}
              name="username"
              rules={[]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('connection.password')}
              name="password"
              rules={[]}
              tooltip={t('connection.passwordTip')}
            >
              <Input.Password
                autoComplete="off"
                disabled={!!id}
              />
            </Form.Item>
          </Col>
        </Row>
        {connectionType === 'mongodb' && (
          <Form.Item
            label={t('connection.authDB')}
            name="database"
            rules={[]}
          >
            <Input autoComplete="off" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default ConnectionModal
