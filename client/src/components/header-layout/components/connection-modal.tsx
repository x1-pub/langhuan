import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Button, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import { showSuccess } from '@/utils/global-notification';
import { CreateConnectionSchema } from '@packages/zod';
import { trpc } from '@/utils/trpc';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EConnectionType } from '@packages/types/connection';

const connectionTypeOptions = [
  {
    label: 'MySQL',
    value: EConnectionType.MYSQL,
  },
  {
    label: 'Redis',
    value: EConnectionType.REDIS,
  },
  {
    label: 'MongoDB',
    value: EConnectionType.MONGODB,
  },
];

type ICreateConnection = z.infer<typeof CreateConnectionSchema>;

interface IConnectionModal {
  open: boolean;
  id?: number;
  onCancel?: () => void;
  onOk?: () => void;
}

const ConnectionModal: React.FC<IConnectionModal> = props => {
  const { open, id, onOk, onCancel } = props;
  const isEditMode = !!id;

  const { t } = useTranslation();
  const [form] = Form.useForm<ICreateConnection>();
  const connectionType = Form.useWatch('type', form);
  const title = t(`button.${id ? 'update' : 'add'}`);

  const detailQuery = useQuery(
    trpc.connection.getDetailById.queryOptions({ id: Number(id) }, { enabled: isEditMode }),
  );
  const pingMutation = useMutation(trpc.connection.ping.mutationOptions());
  const createMutation = useMutation(trpc.connection.create.mutationOptions());
  const updateMutation = useMutation(trpc.connection.update.mutationOptions());

  const handleOk = async () => {
    const values = await form.validateFields();

    if (isEditMode) {
      await updateMutation.mutateAsync({ ...values, id });
    } else {
      await createMutation.mutateAsync(values);
    }
    showSuccess(t('connection.success'));
    onOk?.();
  };

  const handleTest = async () => {
    const values = await form.validateFields();
    await pingMutation.mutateAsync({ ...values, id });
    showSuccess(t('connection.pingSuccess'));
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  const clearForm = () => {
    form.resetFields();
  };

  useEffect(() => {
    if (detailQuery.data) {
      form.setFieldsValue(detailQuery.data);
    }
  }, [detailQuery.data]);

  return (
    <Modal
      width={800}
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      afterClose={clearForm}
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
            onClick={handleOk}
          >
            OK
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
            <Form.Item label={t('connection.username')} name="username" rules={[]}>
              <Input autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('connection.password')}
              name="password"
              rules={[]}
              tooltip={t('connection.passwordTip')}
            >
              <Input.Password autoComplete="off" disabled={isEditMode} />
            </Form.Item>
          </Col>
        </Row>
        {connectionType === 'mongodb' && (
          <Form.Item label={t('connection.authDB')} name="database" rules={[]}>
            <Input autoComplete="off" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ConnectionModal;
