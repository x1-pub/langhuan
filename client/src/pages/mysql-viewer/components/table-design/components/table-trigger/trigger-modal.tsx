import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

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
  const [form] = Form.useForm<TMySQLTrigger>();
  const isEditMode = !!editingTrigger;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSubmit(values);
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
      title={isEditMode ? '编辑触发器' : '新建触发器'}
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
          label="触发器名称"
          style={{ flex: 1 }}
          rules={[
            { required: true, message: '请输入触发器名称' },
            {
              pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
              message: '触发器名称只能包含字母、数字和下划线，且不能以数字开头',
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
                事件类型
                <Tooltip title="INSERT: 插入数据时触发, UPDATE: 更新数据时触发, DELETE: 删除数据时触发">
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请选择事件类型' }]}
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
                触发时机
                <Tooltip title="BEFORE: 在事件发生前触发, AFTER: 在事件发生后触发">
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请选择触发时机' }]}
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
              触发器语句
              <Tooltip title="触发器执行的SQL语句，可以使用NEW和OLD关键字引用新旧数据">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: '请输入触发器语句' }]}
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
