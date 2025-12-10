import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Buffer } from 'buffer';

import useMain from '@/utils/use-main';
import type { TMySQLCondition } from '@packages/types/mysql';
import { EMySQLDataExportType } from '@packages/types/mysql';
import { trpc } from '@/utils/trpc';

interface ExportModalProps {
  visible: boolean;
  condition: TMySQLCondition;
  fields: string[];
  onCancel: () => void;
  onOk: () => void;
}

interface ExportFormValues {
  format: EMySQLDataExportType;
  selectedFields: string[];
}

const formatOptions = [
  { label: 'SQL脚本文件(*.sql)', value: EMySQLDataExportType.SQL },
  { label: 'Excel文件(*.xlsx)', value: EMySQLDataExportType.EXCEL },
  { label: 'JSON文件(*.json)', value: EMySQLDataExportType.JSON },
];

const ExportDataModal: React.FC<ExportModalProps> = props => {
  const { connectionId, dbName, tableName } = useMain();
  const { visible, condition, fields, onCancel, onOk } = props;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ExportFormValues>();

  const exportDataMutation = useMutation(trpc.mysql.exportData.mutationOptions());

  const handleExport = async () => {
    setLoading(true);
    const { format, selectedFields } = form.getFieldsValue();

    try {
      const res = await exportDataMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        condition,
        fields: selectedFields,
        type: format,
      });

      const blob = new Blob([Buffer.from(res.file.data)]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();

      URL.revokeObjectURL(url);

      onOk();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      form?.resetFields();
    }
  }, [visible]);

  return (
    <Modal
      title="数据导出"
      open={visible}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleExport}
      okText={loading ? '生成中' : '导出'}
      width={600}
      destroyOnHidden
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
