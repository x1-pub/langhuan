import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox } from 'antd';

import useMain from '@/utils/use-main';
import { exportData } from '@/api/mysql';
// import type { FormInstance } from 'antd/es/form';

interface ExportModalProps {
  visible: boolean;
  condition: Record<string, any>[];
  fields: string[];
  onCancel: () => void;
  onOk: () => void;
}

enum Format {
  SQL = 'sql',
  EXCEL = 'excel',
  JSON = 'json',
}
interface ExportFormValues {
  format: Format;
  selectedFields: string[];
}

const formatOptions = [
  { label: 'SQL脚本文件(*.sql)', value: Format.SQL },
  { label: 'Excel文件(*.xlsx)', value: Format.EXCEL },
  { label: 'JSON文件(*.json)', value: Format.JSON },
];

const fileNameType = {
  [Format.SQL]: 'sql',
  [Format.JSON]: 'json',
  [Format.EXCEL]: 'xlsx',
}

const ExportDataModal: React.FC<ExportModalProps> = (props) => {
  const { connectionId, dbName, tableName } = useMain()
  const { visible, condition, fields, onCancel, onOk } = props
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ExportFormValues>();

  const handleExport = async () => {
    setLoading(true)
    const { format, selectedFields } = form.getFieldsValue()

    const res = await exportData({
      connectionId,
      dbName,
      tableName,
      condition,
      fields:
      selectedFields,
      type:
      format,
    }).finally(() => setLoading(false))

    const url = window.URL.createObjectURL(new Blob([res]));

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dbName}_${tableName}_${Date.now()}.${fileNameType[format]}`);
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setLoading(false)
    onOk()
  }

  useEffect(() => {
    if (visible) {
      form?.resetFields()
    }
  }, [visible])

  return (
      <Modal
        title="数据导出"
        open={visible}
        confirmLoading={loading}
        onCancel={onCancel}
        onOk={handleExport}
        okText={loading ? '生成中' : '导出'}
        width={600}
        destroyOnClose
      >
        <Form<ExportFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            format: 'sql',
            selectedFields: fields,
          }}
        >
          <Form.Item
            label="导出格式"
            name="format"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select options={formatOptions} />
          </Form.Item>

          <Form.Item
            label="选择字段"
            name="selectedFields"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Checkbox.Group options={fields.map(f => ({ label: f, value: f }))} />
          </Form.Item>
        </Form>
      </Modal>
  );
};

export default ExportDataModal;