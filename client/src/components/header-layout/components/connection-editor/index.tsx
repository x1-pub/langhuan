import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Button, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';

import { showSuccess } from '@/shared/ui/notifications';
import { CreateConnectionSchema } from '@packages/zod/connection';
import { trpc } from '@/infra/api/trpc';
import { EConnectionType } from '@packages/types/connection';

const connectionTypeOptions = [
  { label: 'MySQL', value: EConnectionType.MYSQL },
  { label: 'MariaDB', value: EConnectionType.MARIADB },
  { label: 'Redis', value: EConnectionType.REDIS },
  { label: 'MongoDB', value: EConnectionType.MONGODB },
  { label: 'PostgreSQL', value: EConnectionType.PGSQL },
];

type ConnectionFormValue = z.infer<typeof CreateConnectionSchema>;

const normalizeOptionalPassword = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

interface ConnectionModalProps {
  open: boolean;
  id?: number;
  onCancel?: () => void;
  onOk?: () => void;
}

const buildUpdatePayload = (values: ConnectionFormValue, id: number) => {
  return {
    name: values.name,
    host: values.host,
    port: values.port,
    username: values.username,
    database: values.database,
    password: normalizeOptionalPassword(values.password),
    id,
  };
};

const ConnectionModal: React.FC<ConnectionModalProps> = ({ open, id, onOk, onCancel }) => {
  const isEditMode = Boolean(id);

  const { t } = useTranslation();
  const [form] = Form.useForm<ConnectionFormValue>();
  const connectionType = Form.useWatch('type', form);
  const shouldShowDatabaseField =
    connectionType === EConnectionType.MONGODB || connectionType === EConnectionType.PGSQL;

  const detailQuery = useQuery(
    trpc.connection.getDetailById.queryOptions({ id: Number(id) }, { enabled: isEditMode && open }),
  );
  const pingMutation = useMutation(trpc.connection.ping.mutationOptions());
  const createMutation = useMutation(trpc.connection.create.mutationOptions());
  const updateMutation = useMutation(trpc.connection.update.mutationOptions());

  const modalTitle = t(`button.${isEditMode ? 'update' : 'add'}`);

  const handleSave = async () => {
    const values = await form.validateFields();
    const normalizedValues = {
      ...values,
      password: normalizeOptionalPassword(values.password),
    };

    if (isEditMode && id) {
      await updateMutation.mutateAsync(buildUpdatePayload(normalizedValues, id));
    } else {
      await createMutation.mutateAsync(normalizedValues);
    }

    showSuccess(t('connection.success'));
    onOk?.();
  };

  const handleTest = async () => {
    const values = await form.validateFields();
    await pingMutation.mutateAsync({
      ...values,
      password: normalizeOptionalPassword(values.password),
      id,
    });
    showSuccess(t('connection.pingSuccess'));
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isEditMode) {
      form.resetFields();
    }
  }, [form, isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || !detailQuery.data) {
      return;
    }

    form.setFieldsValue({ ...detailQuery.data, password: undefined });
  }, [detailQuery.data, form, isEditMode, open]);

  return (
    <Modal
      width={800}
      title={modalTitle}
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      loading={detailQuery.isLoading}
      footer={(_, { CancelBtn }) => (
        <>
          <Button
            loading={pingMutation.isPending}
            type="dashed"
            style={{ float: 'left' }}
            onClick={handleTest}
          >
            {t('connection.test')}
          </Button>
          <CancelBtn />
          <Button
            key="submit"
            type="primary"
            loading={updateMutation.isPending || createMutation.isPending}
            onClick={handleSave}
          >
            {t('button.save')}
          </Button>
        </>
      )}
    >
      <Form style={{ paddingTop: '10px' }} form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('connection.type')} name="type" rules={[{ required: true }]}>
              <Select options={connectionTypeOptions} disabled={isEditMode} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('connection.name')} name="name" rules={[{ required: true }]}>
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('connection.host')} name="host" rules={[{ required: true }]}>
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('connection.port')} name="port" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} autoComplete="off" min={1} max={65535} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('connection.username')} name="username">
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('connection.password')}
              name="password"
              tooltip={
                isEditMode ? t('connection.passwordTipEdit') : t('connection.passwordTipCreate')
              }
            >
              <Input.Password
                autoComplete="off"
                placeholder={isEditMode ? t('connection.passwordEditPlaceholder') : undefined}
              />
            </Form.Item>
          </Col>
        </Row>
        {shouldShowDatabaseField && (
          <Form.Item
            label={
              connectionType === EConnectionType.MONGODB
                ? t('connection.authDB')
                : t('connection.defaultDB')
            }
            name="database"
          >
            <Input autoComplete="off" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ConnectionModal;
