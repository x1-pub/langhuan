import React from 'react';
import { Modal, Form, Input, Select, InputNumber, Tooltip, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { IPartitionData, EPartitionType } from './types';

const { Option } = Select;
const { TextArea } = Input;

interface PartitionFormData extends Omit<IPartitionData, 'columns'> {
  columns?: string;
}

interface PartitionModalProps {
  visible: boolean;
  editingPartition: IPartitionData | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: IPartitionData) => Promise<void>;
}

const PartitionModal: React.FC<PartitionModalProps> = ({
  visible,
  editingPartition,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<PartitionFormData>();

  // 处理分区类型变化
  const handlePartitionTypeChange = (type: EPartitionType) => {
    // 根据分区类型清空相关字段
    if (
      [
        EPartitionType.HASH,
        EPartitionType.KEY,
        EPartitionType.LINEAR_HASH,
        EPartitionType.LINEAR_KEY,
      ].includes(type)
    ) {
      form.setFieldsValue({ value: undefined });
    }
    if ([EPartitionType.RANGE_COLUMNS, EPartitionType.LIST_COLUMNS].includes(type)) {
      form.setFieldsValue({ expression: undefined });
    } else {
      form.setFieldsValue({ columns: undefined });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const processedValues: IPartitionData = {
        ...values,
        columns: values.columns ? values.columns.split(',').map(col => col.trim()) : undefined,
      };

      if (editingPartition) {
        processedValues.id = editingPartition.id;
      }

      await onSubmit(processedValues);
    } catch {
      message.error('请检查输入信息');
    }
  };

  React.useEffect(() => {
    if (visible) {
      if (editingPartition) {
        form.setFieldsValue({
          ...editingPartition,
          columns: editingPartition.columns?.join(', '),
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingPartition, form]);

  return (
    <Modal
      title={editingPartition ? '编辑分区' : '新建分区'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: EPartitionType.RANGE,
        }}
        autoComplete="off"
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="name"
            label="分区名称"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: '请输入分区名称' },
              {
                pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                message: '分区名称只能包含字母、数字和下划线，且不能以数字开头',
              },
            ]}
          >
            <Input placeholder="请输入分区名称，如：p0, p1, p_2020" />
          </Form.Item>

          <Form.Item
            name="type"
            label={
              <span>
                分区类型
                <Tooltip title="选择合适的分区类型，RANGE适用于范围分区，LIST适用于列表分区，HASH适用于哈希分区">
                  <InfoCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请选择分区类型' }]}
          >
            <Select onChange={handlePartitionTypeChange}>
              {Object.values(EPartitionType).map(type => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
        >
          {({ getFieldValue }) => {
            const currentType = getFieldValue('type');
            const isColumnsType = [
              EPartitionType.RANGE_COLUMNS,
              EPartitionType.LIST_COLUMNS,
            ].includes(currentType);

            return isColumnsType ? (
              <Form.Item
                name="columns"
                label="分区列"
                rules={[{ required: true, message: '请输入分区列' }]}
              >
                <Input placeholder="请输入分区列，多个列用逗号分隔，如：id, name" />
              </Form.Item>
            ) : (
              <Form.Item
                name="expression"
                label="分区表达式"
                rules={[{ required: true, message: '请输入分区表达式' }]}
              >
                <Input placeholder="请输入分区表达式，如：year(created_at), id % 4" />
              </Form.Item>
            );
          }}
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const currentType = getFieldValue('type');
              const needsValue = ![
                EPartitionType.HASH,
                EPartitionType.KEY,
                EPartitionType.LINEAR_HASH,
                EPartitionType.LINEAR_KEY,
              ].includes(currentType);

              return needsValue ? (
                <Form.Item
                  name="value"
                  label={
                    <span>
                      分区值
                      <Tooltip title="RANGE分区使用LESS THAN值，LIST分区使用IN值列表">
                        <InfoCircleOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    </span>
                  }
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: '请输入分区值' }]}
                >
                  <Input placeholder="如：2020, (1,2,3), MAXVALUE" />
                </Form.Item>
              ) : (
                <div style={{ flex: 1 }}></div>
              );
            }}
          </Form.Item>

          <Form.Item name="engine" label="存储引擎" style={{ flex: 1 }}>
            <Select placeholder="选择存储引擎" allowClear>
              <Option value="InnoDB">InnoDB</Option>
              <Option value="MyISAM">MyISAM</Option>
              <Option value="Memory">Memory</Option>
              <Option value="Archive">Archive</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="comment" label="注释">
          <TextArea rows={2} placeholder="请输入分区注释说明" maxLength={200} showCount />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="dataDirectory" label="数据目录" style={{ flex: 1 }}>
            <Input placeholder="指定分区数据文件存储目录" />
          </Form.Item>

          <Form.Item name="indexDirectory" label="索引目录" style={{ flex: 1 }}>
            <Input placeholder="指定分区索引文件存储目录" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="maxRows" label="最大行数" style={{ flex: 1 }}>
            <InputNumber placeholder="最大行数" min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minRows" label="最小行数" style={{ flex: 1 }}>
            <InputNumber placeholder="最小行数" min={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default PartitionModal;
