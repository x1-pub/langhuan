import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { EMySQLTriggerEvent, EMySQLTriggerTiming, TMySQLTrigger } from '@packages/types/mysql';

const { Option } = Select;
const { TextArea } = Input;

interface TriggerModalProps {
  visible: boolean;
  editingTrigger: TMySQLTrigger | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: TMySQLTrigger) => Promise<void>;
}

const TriggerModal: React.FC<TriggerModalProps> = ({
  visible,
  editingTrigger,
  loading,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<TMySQLTrigger>();
  const isEditMode = !!editingTrigger;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  useEffect(() => {
    if (visible) {
      if (editingTrigger) {
        form.setFieldsValue(editingTrigger);
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingTrigger, form]);

  return (
    <Modal
      title={isEditMode ? t('mysql.editTrigger') : t('mysql.createTrigger')}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          event: EMySQLTriggerEvent.INSERT,
          timing: EMySQLTriggerTiming.BEFORE,
        }}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={t('mysql.triggerName')}
          style={{ flex: 1 }}
          rules={[
            { required: true, message: t('mysql.triggerNameRequired') },
            {
              pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
              message: t('mysql.triggerNamePatternError'),
            },
          ]}
        >
          <Input />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="event"
            label={
              <span>
                {t('mysql.triggerEventType')}
                <Tooltip title={t('mysql.triggerEventTypeTip')}>
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            style={{ flex: 1 }}
            rules={[{ required: true, message: t('mysql.triggerEventRequired') }]}
          >
            <Select>
              {Object.values(EMySQLTriggerEvent).map(event => (
                <Option key={event} value={event}>
                  {event}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="timing"
            label={
              <span>
                {t('mysql.triggerTiming')}
                <Tooltip title={t('mysql.triggerTimingTip')}>
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            style={{ flex: 1 }}
            rules={[{ required: true, message: t('mysql.triggerTimingRequired') }]}
          >
            <Select>
              {Object.values(EMySQLTriggerTiming).map(timing => (
                <Option key={timing} value={timing}>
                  {timing}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="statement"
          label={
            <span>
              {t('mysql.triggerStatement')}
              <Tooltip title={t('mysql.triggerStatementTip')}>
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: t('mysql.triggerStatementRequired') }]}
        >
          <TextArea
            rows={6}
            placeholder={`BEGIN\n  SET NEW.created_at = NOW();\nEND`}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TriggerModal;
