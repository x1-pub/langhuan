import React, { useEffect } from 'react';
import { Form, Input, Modal, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      title={isEditMode ? t('mysql.editPartition') : t('mysql.createPartition')}
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
              {t('mysql.partitionDefinition')}
              <Tooltip title={t('mysql.partitionDefinitionTip')}>
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: t('mysql.partitionDefinitionRequired') }]}
        >
          <TextArea
            rows={6}
            placeholder={t('mysql.partitionDefinitionPlaceholder')}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PartitionModal;
