import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, InputNumber, Row, Select, Tooltip } from 'antd';

import KeyTypeIcon from '../key-type-icon';
import ValueEditor from '../value-editor';
import useMain from '@/utils/use-main';
import styles from './index.module.less';
import { useTranslation } from 'react-i18next';
import { ERedisDataType, TRedisValue } from '@packages/types/redis';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';

type FieldType = {
  type: ERedisDataType;
  ttl: number;
  key: string;
  value: TRedisValue;
};

interface AddKeyBoxProps {
  onAddSuccess?: (key: string, type: ERedisDataType) => void;
  onCancel?: () => void;
}

const AddKeyBox: React.FC<AddKeyBoxProps> = ({ onAddSuccess, onCancel }) => {
  const { connectionId, dbName } = useMain();
  const [form] = Form.useForm<FieldType>();
  const { t } = useTranslation();
  const addValueMutation = useMutation(trpc.redis.addValue.mutationOptions());

  const typeValue = Form.useWatch('type', form) || ERedisDataType.STRING;

  const handleSubmit = async () => {
    await form.validateFields();
    const { key, ttl, value, type } = form.getFieldsValue();
    await addValueMutation.mutateAsync({
      connectionId,
      dbName,
      key,
      ttl: ttl ? Number(ttl) : undefined,
      value,
      type,
    });
    onAddSuccess?.(key, type);
  };

  const handleChange = (changedValues: FieldType) => {
    if (changedValues.type) {
      form.setFieldValue('value', undefined);
    }
  };

  return (
    <div className={styles.addBoxWrap}>
      <div>
        <div className={styles.addBoxheader}>
          <span>{t('redis.newKey')}</span>
          <Tooltip placement="left" title={t('button.close')}>
            <CloseOutlined style={{ cursor: 'pointer' }} onClick={onCancel} />
          </Tooltip>
        </div>
        <Divider className={styles.divider} />
      </div>

      <div className={styles.addBoxMain}>
        <Form autoComplete="off" layout="vertical" form={form} onValuesChange={handleChange}>
          <Row gutter={10}>
            <Col span={12}>
              <Form.Item<FieldType>
                label={t('redis.keyType')}
                name="type"
                rules={[{ required: true }]}
                initialValue={ERedisDataType.STRING}
              >
                <Select>
                  {Object.values(ERedisDataType).map(key => (
                    <Select.Option value={key} key={key}>
                      <KeyTypeIcon type={key} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item<FieldType> label="TTL" name="ttl">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item<FieldType> label={t('redis.keyName')} name="key" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Divider className={styles.divider} />
          <Form.Item<FieldType> label="" name="value">
            <ValueEditor mode="add" type={typeValue} />
          </Form.Item>
        </Form>
      </div>

      <div>
        <Divider className={styles.divider} />
        <div className={styles.addBoxfooter}>
          <Button onClick={onCancel}>{t('button.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit}>
            {t('button.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddKeyBox;
