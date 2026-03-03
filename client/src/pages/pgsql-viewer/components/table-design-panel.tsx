import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';
import StructurePanel from './structure-panel';
import IndexesPanel from './indexes-panel';

type TDesignTab = 'structure' | 'indexes';

interface TableDesignPanelProps {
  structureLoading: boolean;
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
  structureMutating: boolean;
  onCreateColumn: (value: {
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue?: string;
    comment?: string;
  }) => Promise<void>;
  onUpdateColumn: (
    oldName: string,
    value: {
      name: string;
      dataType: string;
      nullable: boolean;
      defaultValue?: string;
      comment?: string;
    },
  ) => Promise<void>;
  onDeleteColumn: (name: string) => Promise<void>;
  indexesLoading: boolean;
  indexes: Array<{
    name: string;
    definition: string;
  }>;
  columnOptions: Array<{
    label: string;
    value: string;
  }>;
  isMutatingIndexes: boolean;
  onCreateIndex: (draft: {
    indexName: string;
    method: string;
    columns: string[];
    unique: boolean;
  }) => Promise<void>;
  onUpdateIndex: (
    oldName: string,
    draft: {
      indexName: string;
      method: string;
      columns: string[];
      unique: boolean;
    },
  ) => Promise<void>;
  onDropIndex: (indexName: string) => Promise<void>;
}

const TableDesignPanel: React.FC<TableDesignPanelProps> = ({
  structureLoading,
  columns,
  structureMutating,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
  indexesLoading,
  indexes,
  columnOptions,
  isMutatingIndexes,
  onCreateIndex,
  onUpdateIndex,
  onDropIndex,
}) => {
  const { t } = useTranslation();
  const [activeDesignTab, setActiveDesignTab] = useState<TDesignTab>('structure');

  return (
    <div className={styles.designPanel}>
      <Tabs
        activeKey={activeDesignTab}
        className={styles.designTabs}
        onChange={key => setActiveDesignTab(key as TDesignTab)}
        items={[
          {
            key: 'structure',
            label: t('pgsql.structure'),
            children: (
              <StructurePanel
                loading={structureLoading}
                columns={columns}
                isMutating={structureMutating}
                onCreateColumn={onCreateColumn}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
              />
            ),
          },
          {
            key: 'indexes',
            label: t('pgsql.indexes'),
            children: (
              <IndexesPanel
                loading={indexesLoading}
                indexes={indexes}
                columnOptions={columnOptions}
                isMutating={isMutatingIndexes}
                onCreateIndex={onCreateIndex}
                onUpdateIndex={onUpdateIndex}
                onDropIndex={onDropIndex}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default TableDesignPanel;
