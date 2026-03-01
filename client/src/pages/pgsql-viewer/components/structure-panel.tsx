import React from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';

interface StructurePanelProps {
  loading: boolean;
  columns: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue: string | null;
    comment: string | null;
    isPrimaryKey: boolean;
    isIdentity: boolean;
    identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
  }>;
}

const StructurePanel: React.FC<StructurePanelProps> = ({ loading, columns }) => {
  const { t } = useTranslation();

  return (
    <Table
      rowKey="name"
      loading={loading}
      dataSource={columns}
      pagination={false}
      scroll={{ x: 'max-content', y: 'calc(100vh - 375px)' }}
      columns={[
        {
          title: t('table.name'),
          dataIndex: 'name',
          width: 220,
        },
        {
          title: t('table.type'),
          dataIndex: 'dataType',
          width: 220,
        },
        {
          title: t('table.allowNull'),
          dataIndex: 'nullable',
          width: 120,
          render: value => (value ? 'YES' : 'NO'),
        },
        {
          title: t('table.default'),
          dataIndex: 'defaultValue',
          width: 260,
          render: value => (value ? String(value) : '-'),
        },
        {
          title: t('pgsql.identity'),
          key: 'identity',
          width: 180,
          render: (_, row) => (row.isIdentity ? row.identityGeneration || 'BY DEFAULT' : '-'),
        },
        {
          title: t('table.index'),
          dataIndex: 'isPrimaryKey',
          width: 160,
          render: value => (value ? 'PRIMARY' : '-'),
        },
        {
          title: t('table.comment'),
          dataIndex: 'comment',
          render: value => (value ? String(value) : '-'),
        },
      ]}
    />
  );
};

export default StructurePanel;
