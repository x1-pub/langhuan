import React, { useState } from 'react';
import { Button, Modal, Tooltip, Table, type TableProps } from 'antd';
import { KeyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import useMain from '@/utils/use-main';
import { showSuccess } from '@/utils/global-notification';
import EllipsisText from '@/components/ellipsis-text';
import type {
  TMySQLCondition,
  IMySQLColumn,
  TMySQLProcessedData,
  TMySQLRawData,
} from '@packages/types/mysql';
import styles from './editor.module.less';
import { trpc } from '@/utils/trpc';
import MySQLRawDataEditor from '@/components/mysql-raw-data-editor';

interface EditorProps {
  data?: Record<string, TMySQLRawData>;
  columns: IMySQLColumn[];
  condition: TMySQLCondition;
  onOk: () => void;
  onCancel: () => void;
  show?: boolean;
}

const Editor: React.FC<EditorProps> = ({ data = {}, columns, onOk, onCancel, show, condition }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, TMySQLProcessedData>>({});
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useMain();
  const type = data && Object.keys(data).length ? 'update' : 'add';

  const batchUpdateDataMutation = useMutation(trpc.mysql.batchUpdateData.mutationOptions());
  const batchInsertDataMutation = useMutation(trpc.mysql.batchInsertData.mutationOptions());

  const dataSource = columns.map(col => ({
    key: col.Field,
    value: data[col.Field],
    type: col.Type,
    default: col.Default,
    desc: col.Comment,
    required: col.Null === 'NO' && col.Extra !== 'auto_increment' && !col.Default,
    pri: col.Key === 'PRI',
    autoIncrement: col.Extra === 'auto_increment',
  }));

  const tableColumns: TableProps<(typeof dataSource)[number]>['columns'] = [
    {
      title: t('table.key'),
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (value: string, record) => {
        const pri = record.pri ? <KeyOutlined style={{ color: '#EBAD32' }} /> : null;
        const mark = record.required ? <span className={styles.mark}>*</span> : null;
        const text = <EllipsisText text={value} width={150} />;
        const comment = record.desc ? (
          <Tooltip placement="right" title={record.desc}>
            <QuestionCircleOutlined />
          </Tooltip>
        ) : null;

        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {pri}
            {mark}
            {text}
            {comment}
          </span>
        );
      },
    },
    {
      title: t('table.value'),
      dataIndex: 'value',
      key: 'value',
      render: (value: TMySQLRawData, record) => {
        return (
          <MySQLRawDataEditor
            type={record.type}
            value={value}
            onChange={v => handleChange(record.key, v)}
          />
        );
      },
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 135,
      ellipsis: true,
    },
    {
      title: t('table.default'),
      dataIndex: 'default',
      key: 'default',
      width: 130,
      ellipsis: true,
    },
  ];

  const handleChange = (name: string, value: TMySQLProcessedData) => {
    setForm({ ...form, [name]: value });
  };

  const handleOk = async () => {
    setLoading(true);
    let result: number | string;

    try {
      if (type === 'update') {
        result = await batchUpdateDataMutation.mutateAsync({
          connectionId,
          dbName,
          tableName,
          condition,
          data: form,
        });
      } else {
        result = await batchInsertDataMutation.mutateAsync({
          connectionId,
          dbName,
          tableName,
          data: form,
        });
      }
      showSuccess(t('mysql.affectedCount', { count: result }));
      onOk();
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setLoading(false);
    setForm({});
  };

  return (
    <>
      <Modal
        wrapClassName={styles.modalWrap}
        destroyOnHidden={true}
        title={t(`button.${type}`)}
        open={show}
        onCancel={onCancel}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            {t('button.cancel')}
          </Button>,
          <Button key="ok" type="primary" loading={loading} onClick={handleOk}>
            {t('button.submit')}
          </Button>,
        ]}
        afterClose={clearForm}
      >
        <Table
          rowKey="key"
          className={styles.tableWrap}
          columns={tableColumns}
          dataSource={dataSource}
          pagination={false}
        />
      </Modal>
    </>
  );
};

export default Editor;
