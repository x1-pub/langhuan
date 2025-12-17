import React, { useEffect } from 'react';
import { Col, Form, Input, Modal, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { trpc } from '@/utils/trpc';
import { EConnectionType } from '@packages/types/connection';
import { EEditorType, TEditorData } from './types';

interface IEditorFormConfig {
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

const Editor: React.FC<EditorProps> = props => {
  const { type, connectionId, data, onOk, onCancel } = props;

  const { t } = useTranslation();
  const [form] = Form.useForm<IEditorFormConfig>();
  const createDatabaseMutation = useMutation(trpc.database.create.mutationOptions());
  const updateDatabaseMutation = useMutation(trpc.database.update.mutationOptions());
  const createTableMutation = useMutation(trpc.table.create.mutationOptions());
  const updateTableMutation = useMutation(trpc.table.update.mutationOptions());

  const modalTitleMap = {
    [EEditorType.CREATE_DB]: t('mysql.createDb'),
    [EEditorType.CREATE_TABLE]: t('mysql.createTable'),
    [EEditorType.EDIT_DB]: t('mysql.editDb'),
    [EEditorType.EDIT_TABLE]: t('mysql.editTable'),
  };

  const handleSubmit = async () => {
    if (!data) {
      return;
    }

    const { name, comment, charset, collation } = await form.validateFields();
    if (data.type === EEditorType.CREATE_TABLE) {
      await createTableMutation.mutateAsync({
        type,
        connectionId,
        dbName: data.dbName!,
        tableName: name,
        comment,
      });
    }
    if (data.type === EEditorType.EDIT_TABLE) {
      await updateTableMutation.mutateAsync({
        type,
        connectionId,
        dbName: data.dbName!,
        tableName: data.tableName!,
        newTableName: name,
        comment,
      });
    }
    if (data.type === EEditorType.CREATE_DB) {
      await createDatabaseMutation.mutateAsync({
        type,
        connectionId,
        dbName: name,
        charset,
        collation,
      });
    }
    if (data.type === EEditorType.EDIT_DB) {
      await updateDatabaseMutation.mutateAsync({
        type,
        connectionId,
        dbName: name,
        charset,
        collation,
      });
    }

    onOk?.();
  };

  const initForm = () => {
    if (!data?.type || !form) {
      return;
    }

    let name: string | undefined;
    switch (data.type) {
      case EEditorType.EDIT_DB:
        name = data.dbName;
        break;
      case EEditorType.EDIT_TABLE:
        name = data.tableName;
        break;
      default:
        name = undefined;
    }

    form.setFieldsValue({ ...data, name });
  };

  useEffect(() => {
    initForm();
  }, [data]);

  if (!data) {
    return;
  }

  return (
    <Modal
      title={modalTitleMap[data.type]}
      open={!!data.type}
      onOk={handleSubmit}
      onCancel={onCancel}
      destroyOnHidden
      width={600}
      afterClose={() => form?.resetFields()}
    >
      <Form style={{ paddingTop: '10px' }} layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="名字"
              name="name"
              rules={[{ required: true, message: '请输入字段名称' }]}
            >
              <Input disabled={data?.type === EEditorType.EDIT_DB} autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        {[EEditorType.CREATE_TABLE, EEditorType.EDIT_TABLE].includes(data.type) && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="备注" name="comment">
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
        )}
        {[EEditorType.CREATE_DB, EEditorType.EDIT_DB].includes(data.type) && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="字符集" name="charset">
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排序规则" name="collation">
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
