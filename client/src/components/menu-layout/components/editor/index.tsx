import React, { useEffect } from 'react';
import { Col, Form, Input, Modal, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { trpc } from '@/infra/api/trpc';
import { EConnectionType } from '@packages/types/connection';
import { EEditorType, TEditorData } from './types';

interface EditorFormConfig {
  name: string;
  comment?: string;
  charset?: string;
  collation?: string;
}

interface EditorProps {
  type: EConnectionType;
  data?: TEditorData;
  connectionId: number;
  onOk?: () => void;
  onCancel?: () => void;
}

const getModalName = (data: TEditorData) => {
  switch (data.type) {
    case EEditorType.EDIT_DB:
      return data.dbName;
    case EEditorType.EDIT_TABLE:
      return data.tableName;
    default:
      return undefined;
  }
};

const Editor: React.FC<EditorProps> = ({ type, connectionId, data, onOk, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<EditorFormConfig>();

  const createDatabaseMutation = useMutation(trpc.database.create.mutationOptions());
  const updateDatabaseMutation = useMutation(trpc.database.update.mutationOptions());
  const createTableMutation = useMutation(trpc.table.create.mutationOptions());
  const updateTableMutation = useMutation(trpc.table.update.mutationOptions());

  const localePrefix = type === EConnectionType.PGSQL ? 'pgsql' : 'mysql';
  const isMysqlCompatible = type === EConnectionType.MYSQL || type === EConnectionType.MARIADB;

  const modalTitleMap = {
    [EEditorType.CREATE_DB]: t(`${localePrefix}.createDb`),
    [EEditorType.CREATE_TABLE]: t(`${localePrefix}.createTable`),
    [EEditorType.EDIT_DB]: t(`${localePrefix}.editDb`),
    [EEditorType.EDIT_TABLE]: t(`${localePrefix}.editTable`),
  };

  const handleSubmit = async () => {
    if (!data) {
      return;
    }

    const { name, comment, charset, collation } = await form.validateFields();

    switch (data.type) {
      case EEditorType.CREATE_TABLE:
        await createTableMutation.mutateAsync({
          type,
          connectionId,
          dbName: data.dbName,
          tableName: name,
          comment,
        });
        break;
      case EEditorType.EDIT_TABLE:
        await updateTableMutation.mutateAsync({
          type,
          connectionId,
          dbName: data.dbName,
          tableName: data.tableName,
          newTableName: name,
          comment,
        });
        break;
      case EEditorType.CREATE_DB:
        await createDatabaseMutation.mutateAsync({
          type,
          connectionId,
          dbName: name,
          charset,
          collation,
        });
        break;
      case EEditorType.EDIT_DB:
        await updateDatabaseMutation.mutateAsync({
          type,
          connectionId,
          dbName: name,
          charset,
          collation,
        });
        break;
      default:
        break;
    }

    onOk?.();
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    form.setFieldsValue({
      ...data,
      name: getModalName(data),
    });
  }, [data, form]);

  if (!data) {
    return null;
  }

  return (
    <Modal
      title={modalTitleMap[data.type]}
      open={true}
      onOk={handleSubmit}
      onCancel={onCancel}
      destroyOnHidden
      width={600}
      afterClose={() => form.resetFields()}
    >
      <Form style={{ paddingTop: '10px' }} layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={t('table.name')}
              name="name"
              rules={[{ required: true, message: t(`${localePrefix}.editorNameRequired`) }]}
            >
              <Input disabled={data.type === EEditorType.EDIT_DB} autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>

        {(data.type === EEditorType.CREATE_TABLE || data.type === EEditorType.EDIT_TABLE) && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label={t('table.comment')} name="comment">
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {isMysqlCompatible &&
          (data.type === EEditorType.CREATE_DB || data.type === EEditorType.EDIT_DB) && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={t('table.charset')} name="charset">
                  <Input autoComplete="off" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('table.collation')} name="collation">
                  <Input autoComplete="off" />
                </Form.Item>
              </Col>
            </Row>
          )}
      </Form>
    </Modal>
  );
};

export default Editor;
