import React, { useEffect } from 'react';
import { Form, Input, Modal, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface IFormValue {
  definition: string;
}

interface PartitionModalProps {
  visible: boolean;
  loading: boolean;
  editingName: string | null;
  onCancel: () => void;
  onSubmit: (values: IFormValue) => Promise<void>;
}

const { TextArea } = Input;

const PartitionModal: React.FC<PartitionModalProps> = ({
  visible,
  loading,
  editingName,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<IFormValue>();
  const isEditMode = !!editingName;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (editingName) {
        form.setFieldsValue({
          definition: `PARTITION ${editingName} VALUES LESS THAN () COMMENT ''`,
        });
      }
    }
  }, [visible, editingName, form]);

  return (
    <Modal
      title={isEditMode ? '编辑分区' : '新建分区'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={720}
      destroyOnHidden
    >
      <Form<IFormValue> layout="vertical" form={form} autoComplete="off">
        <Form.Item
          name="definition"
          label={
            <span>
              分区定义
              <Tooltip title="填写完整分区定义内容，将直接插入到 ADD PARTITION ( ... ) 中，例如：PARTITION p2025 VALUES LESS THAN (20250101)">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: '请输入分区定义' }]}
        >
          <TextArea
            rows={6}
            placeholder={`PARTITION p2025 VALUES LESS THAN (20250101) COMMENT '示例'`}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PartitionModal;
