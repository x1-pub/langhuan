import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Buffer } from 'buffer';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import type { TMySQLCondition } from '@packages/types/mysql';
import { EMySQLDataExportType } from '@packages/types/mysql';
import { trpc } from '@/infra/api/trpc';

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

const ExportDataModal: React.FC<ExportModalProps> = props => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const { visible, condition, fields, onCancel, onOk } = props;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ExportFormValues>();
  const formatOptions = [
    { label: t('mysql.exportFormatSql'), value: EMySQLDataExportType.SQL },
    { label: t('mysql.exportFormatExcel'), value: EMySQLDataExportType.EXCEL },
    { label: t('mysql.exportFormatJson'), value: EMySQLDataExportType.JSON },
  ];

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
  }, [form, visible]);

  return (
    <Modal
      title={t('mysql.exportData')}
      open={visible}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleExport}
      okText={loading ? t('mysql.exportGenerating') : t('button.export')}
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
          label={t('mysql.exportFormat')}
          name="format"
          rules={[{ required: true, message: t('mysql.exportFormatRequired') }]}
        >
          <Select options={formatOptions} />
        </Form.Item>

        <Form.Item
          label={t('mysql.exportSelectFields')}
          name="selectedFields"
          rules={[{ required: true, message: t('mysql.exportFieldsRequired') }]}
        >
          <Checkbox.Group options={fields.map(f => ({ label: f, value: f }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportDataModal;
