import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Checkbox, Row, Col, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import useDatabaseWindows from '@/hooks/use-database-windows';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { EMySQLFieldDefaultType, IMySQLColumn, TMysqlBaseColumnInfo } from '@packages/types/mysql';
import { trpc } from '@/utils/trpc';

interface FieldEditorProps {
  editRow?: IMySQLColumn;
  visible: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

// 类型选项
const FIELD_TYPES = [
  'INT',
  'FLOAT',
  'DOUBLE',
  'CHAR',
  'VARCHAR',
  'TEXT',
  'JSON',
  'DATETIME',
  'TIMESTAMP',
  'YEAR',
  'TIME',
  'DATE',

  'TINYTEXT',
  'MEDIUMTEXT',
  'LONGTEXT',
  'ENUM',
  'SET',

  'TINYINT',
  'SMALLINT',
  'MEDIUMINT',
  'INTEGER',
  'BIGINT',
  'DECIMAL',
  'NUMERIC',
  'BOOLEAN',
  'BOOL',
  'REAL',
  'BIT',

  'BINARY',
  'VARBINARY',
  'BLOB',
  'MEDIUMBLOB',
  'TINYBLOB',
  'LONGBLOB',

  'GEOMETRY',
  'POINT',
  'LINESTRING',
  'POLYGON',
  'MULTIPOINT',
  'MULTILINESTRING',
  'MULTIPOLYGON',
  'GEOMCOLLECTION',
];

// 字符集和排序规则选项
const CHARSET_OPTIONS = [
  { value: 'utf8mb4', label: 'utf8mb4' },
  { value: 'utf8', label: 'utf8' },
  { value: 'latin1', label: 'latin1' },
];

const COLLATION_OPTIONS = {
  utf8mb4: [
    { value: 'utf8mb4_general_ci', label: 'utf8mb4_general_ci' },
    { value: 'utf8mb4_unicode_ci', label: 'utf8mb4_unicode_ci' },
  ],
  utf8: [
    { value: 'utf8_general_ci', label: 'utf8_general_ci' },
    { value: 'utf8_unicode_ci', label: 'utf8_unicode_ci' },
  ],
  latin1: [{ value: 'latin1_swedish_ci', label: 'latin1_swedish_ci' }],
};

// 显示长度的字段类型
const needLengthTypes = [
  'TINYINT',
  'SMALLINT',
  'MEDIUMINT',
  'INT',
  'INTEGER',
  'BIGINT',
  'BIT',
  'CHAR',
  'VARCHAR',
];

// 显示精度的字段类型
const needPrecisionTypes = ['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL', 'BINARY'];

// 显示枚举值的字段类型
const needEnumTypes = ['ENUM', 'SET'];

// 必须填长度的字段
const varTypes = ['VARCHAR', 'VARBINARY'];

// 显示无符号/补零
const needFillZeroTypes = [
  'INT',
  'INTEGER',
  'BIGINT',
  'DECIMAL',
  'NUMERIC',
  'DOUBLE',
  'FLOAT',
  'REAL',
  'TINYINT',
  'SMALLINT',
  'MEDIUMINT',
];

// 显示字符集
const needCharsetTypes = [
  'VARCHAR',
  'TEXT',
  'CHAR',
  'TINYTEXT',
  'MEDIUMTEXT',
  'LONGTEXT',
  'ENUM',
  'SET',
];

// 显示根据当前时间戳更新
const fullTimeTypes = ['TIMESTAMP', 'DATETIME'];

// 现在自动递增
const autoIncrementTypes = ['INT', 'INTEGER', 'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT'];

const FieldEditor: React.FC<FieldEditorProps> = ({ editRow, visible, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [form] = Form.useForm<TMysqlBaseColumnInfo>();
  const selectedType = Form.useWatch('fieldType', form);
  const charsetValue = Form.useWatch('charset', form);
  const fieldExtraValue = Form.useWatch('fieldExtra', form);
  const defaultValueType = Form.useWatch('defaultValueType', form);

  const addColumnMutation = useMutation(trpc.mysql.addColumn.mutationOptions());
  const updateColumnMutation = useMutation(trpc.mysql.updateColumn.mutationOptions());

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 转换默认值格式
      const processedValues = {
        ...values,
        defaultValue:
          defaultValueType === 'CUSTOM'
            ? values.defaultValue
            : defaultValueType === 'NULL'
              ? 'NULL'
              : defaultValueType === 'EMPTY_STRING'
                ? "''"
                : undefined,
      };

      if (editRow?.Field) {
        await updateColumnMutation.mutateAsync({
          ...processedValues,
          oldFieldName: editRow.Field,
          connectionId,
          dbName,
          tableName,
        });
      } else {
        await addColumnMutation.mutateAsync({
          ...processedValues,
          connectionId,
          dbName,
          tableName,
        });
      }

      form.resetFields();
      onSubmit();
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: TMysqlBaseColumnInfo) => {
    if ('defaultValueType' in changedValues) {
      // 当切换默认值类型时清空自定义值
      if (changedValues.defaultValueType !== 'CUSTOM') {
        form.setFieldsValue({ defaultValue: undefined });
      }
    }
  };

  useEffect(() => {
    if (visible && editRow) {
      const defaultForm: Partial<TMysqlBaseColumnInfo> = {};
      const { Collation, Comment, Type, Field, Key, Extra, Default, Null } = editRow;

      defaultForm.fieldName = Field;
      defaultForm.allowNull = Null === 'YES';
      if (Default == null && Null === 'YES') {
        defaultForm.defaultValueType = EMySQLFieldDefaultType.NULL;
      } else if (Default == null) {
        defaultForm.defaultValueType = EMySQLFieldDefaultType.NONE;
      } else if (Default === '') {
        defaultForm.defaultValueType = EMySQLFieldDefaultType.EMPTY_STRING;
      } else {
        defaultForm.defaultValueType = EMySQLFieldDefaultType.CUSTOM;
        defaultForm.defaultValue = Default as string;
      }
      if (Key === 'PRI') {
        defaultForm.isPrimary = true;
      }
      if (Extra.includes('auto_increment')) {
        defaultForm.autoIncrement = true;
      }
      if (Extra.includes('on update CURRENT_TIMESTAMP')) {
        defaultForm.onUpdateCurrentTime = true;
      }
      if (Collation) {
        const [charset] = Collation.split('_');
        defaultForm.charset = charset;
        defaultForm.collation = Collation;
      }
      if (Comment) {
        defaultForm.comment = Comment;
      }
      if (Type) {
        const [allType, ...rest] = Type.split(' ');
        if (rest.includes('unsigned')) {
          defaultForm.unsigned = true;
        }
        if (rest.includes('zerofill')) {
          defaultForm.zerofill = true;
        }
        const [, type = '', extra] = allType.match(/(.+)\((.+)\)/) || [];
        defaultForm.fieldType = (type || Type).toLocaleUpperCase();
        if (extra) {
          defaultForm.fieldExtra = extra;
        }
      }
      form.setFieldsValue(defaultForm);
    }

    if (!visible) {
      form.resetFields();
    }
  }, [visible, editRow]);

  return (
    <Modal
      title={editRow ? t('button.edit') : t('button.create')}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          allowNull: true,
          defaultValueType: 'NONE',
          isPrimary: false,
          unsigned: false,
          zerofill: false,
          autoIncrement: false,
        }}
        onValuesChange={handleValuesChange}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('table.name')} name="fieldName" rules={[{ required: true }]}>
              <Input autoComplete="off" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t('table.type')} name="fieldType" rules={[{ required: true }]}>
              <Select showSearch options={FIELD_TYPES.map(t => ({ value: t, label: t }))} />
            </Form.Item>
          </Col>
        </Row>

        {[...needLengthTypes, ...needPrecisionTypes, ...needEnumTypes, ...varTypes].includes(
          selectedType,
        ) && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('table.columnTypeAA')}
                name="fieldExtra"
                tooltip={
                  <div>
                    <div>{t('table.e1')}:</div>
                    <div>1. {t('table.e2')}</div>
                    <div>2. {t('table.e3')}</div>
                    <div>3. {t('table.e4')}</div>
                  </div>
                }
                rules={[{ required: varTypes.includes(selectedType) }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            {!!fieldExtraValue && (
              <Col span={12}>
                <Form.Item label=" ">{`${selectedType}(${fieldExtraValue})`}</Form.Item>
              </Col>
            )}
          </Row>
        )}

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="allowNull" valuePropName="checked">
              <Checkbox>{t('table.allowNull')}</Checkbox>
            </Form.Item>
          </Col>

          {autoIncrementTypes.includes(selectedType) && (
            <Col span={6}>
              <Form.Item name="autoIncrement" valuePropName="checked">
                <Checkbox>
                  {t('table.autoIncrement')}&nbsp;
                  <Tooltip
                    title={
                      <>
                        <div>自动递增字段需满足: </div>
                        <div>1. 整数类型</div>
                        <div>2. PRIMARY或UNIQUE类型索引</div>
                        <div>3. 每个表最多有一个</div>
                      </>
                    }
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Checkbox>
              </Form.Item>
            </Col>
          )}

          {needFillZeroTypes.includes(selectedType) && (
            <>
              <Col span={6}>
                <Form.Item name="unsigned" valuePropName="checked">
                  <Checkbox>{t('table.unsigned')}</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="zerofill" valuePropName="checked">
                  <Checkbox>{t('table.zeroFill')}</Checkbox>
                </Form.Item>
              </Col>
            </>
          )}

          {fullTimeTypes.includes(selectedType) && (
            <Col span={6}>
              <Form.Item name="onUpdateCurrentTime" valuePropName="checked">
                <Checkbox>{t('table.ut')}</Checkbox>
              </Form.Item>
            </Col>
          )}
        </Row>

        {needCharsetTypes.includes(selectedType) && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('table.charset')} name="charset">
                <Select allowClear options={CHARSET_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('table.collation')} name="collation">
                <Select
                  allowClear
                  options={
                    charsetValue
                      ? COLLATION_OPTIONS[charsetValue as keyof typeof COLLATION_OPTIONS]
                      : []
                  }
                  disabled={!charsetValue}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item label={t('table.default')} style={{ marginBottom: 16 }}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="defaultValueType">
                <Select
                  options={[
                    { label: t('table.noDefault'), value: 'NONE' },
                    { label: 'NULL', value: 'NULL' },
                    { label: t('table.emptyString'), value: 'EMPTY_STRING' },
                    { label: t('table.custom'), value: 'CUSTOM' },
                  ]}
                />
              </Form.Item>
            </Col>
            {defaultValueType === 'CUSTOM' && (
              <Col span={12}>
                <Form.Item name="defaultValue" rules={[{ required: true }]}>
                  <Input autoComplete="off" />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form.Item>

        <Form.Item label={t('table.comment')} name="comment">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FieldEditor;
