import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  message,
  Descriptions
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export enum TriggerEvent {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum TriggerTiming {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER'
}

export interface TriggerData {
  id?: string;
  name: string;
  event: TriggerEvent;
  timing: TriggerTiming;
  tableName: string;
  statement: string;
  created?: string;
  sqlMode?: string;
  characterSetClient?: string;
  collationConnection?: string;
}

interface TriggerModalProps {
  visible: boolean;
  editingTrigger: TriggerData | null;
  viewingTrigger: TriggerData | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: TriggerData) => Promise<void>;
}

const TriggerModal: React.FC<TriggerModalProps> = ({
  visible,
  editingTrigger,
  viewingTrigger,
  loading,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm<TriggerData>();
  const isViewMode = !!viewingTrigger;
  const isEditMode = !!editingTrigger;

  const handleSubmit = async () => {
    if (isViewMode) {
      onCancel();
      return;
    }

    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      message.error('请检查输入信息');
    }
  };

  React.useEffect(() => {
    if (visible) {
      if (editingTrigger) {
        form.setFieldsValue(editingTrigger);
      } else if (viewingTrigger) {
        form.setFieldsValue(viewingTrigger);
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingTrigger, viewingTrigger, form]);

  const getModalTitle = () => {
    if (isViewMode) return '查看触发器';
    if (isEditMode) return '编辑触发器';
    return '新建触发器';
  };

  if (isViewMode && viewingTrigger) {
    return (
      <Modal
        title={getModalTitle()}
        open={visible}
        onOk={handleSubmit}
        onCancel={onCancel}
        width={800}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="触发器名称" span={2}>
            {viewingTrigger.name}
          </Descriptions.Item>
          <Descriptions.Item label="事件类型">
            {viewingTrigger.event}
          </Descriptions.Item>
          <Descriptions.Item label="触发时机">
            {viewingTrigger.timing}
          </Descriptions.Item>
          <Descriptions.Item label="表名">
            {viewingTrigger.tableName}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {viewingTrigger.created || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="SQL模式" span={2}>
            {viewingTrigger.sqlMode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="字符集">
            {viewingTrigger.characterSetClient || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="排序规则">
            {viewingTrigger.collationConnection || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="触发器语句" span={2}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              margin: 0,
              fontSize: '12px'
            }}>
              {viewingTrigger.statement}
            </pre>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  }

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          event: TriggerEvent.INSERT,
          timing: TriggerTiming.BEFORE,
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="name"
            label="触发器名称"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: '请输入触发器名称' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '触发器名称只能包含字母、数字和下划线，且不能以数字开头' }
            ]}
          >
            <Input placeholder="请输入触发器名称，如：update_modified_time" />
          </Form.Item>

          <Form.Item
            name="tableName"
            label="表名"
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请输入表名' }]}
          >
            <Input placeholder="请输入表名，如：users" />
          </Form.Item>
        </div>

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
              {Object.values(TriggerEvent).map(event => (
                <Option key={event} value={event}>{event}</Option>
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
              {Object.values(TriggerTiming).map(timing => (
                <Option key={timing} value={timing}>{timing}</Option>
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
            placeholder={`请输入触发器语句，例如：
INSERT事件: SET NEW.created_at = NOW();
UPDATE事件: SET NEW.updated_at = NOW();
DELETE事件: INSERT INTO logs (action, table_name, record_id) VALUES ('DELETE', 'users', OLD.id);`}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="sqlMode"
            label="SQL模式"
            style={{ flex: 1 }}
          >
            <Input placeholder="SQL模式，如：STRICT_TRANS_TABLES" />
          </Form.Item>

          <Form.Item
            name="characterSetClient"
            label="字符集"
            style={{ flex: 1 }}
          >
            <Select placeholder="选择字符集" allowClear>
              <Option value="utf8mb4">utf8mb4</Option>
              <Option value="utf8">utf8</Option>
              <Option value="latin1">latin1</Option>
              <Option value="gbk">gbk</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="collationConnection"
          label="排序规则"
        >
          <Select placeholder="选择排序规则" allowClear>
            <Option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</Option>
            <Option value="utf8mb4_general_ci">utf8mb4_general_ci</Option>
            <Option value="utf8_unicode_ci">utf8_unicode_ci</Option>
            <Option value="utf8_general_ci">utf8_general_ci</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TriggerModal;