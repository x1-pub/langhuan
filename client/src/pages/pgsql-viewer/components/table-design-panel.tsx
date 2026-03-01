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
  indexesLoading: boolean;
  indexes: Array<{
    name: string;
    definition: string;
  }>;
  columnOptions: Array<{
    label: string;
    value: string;
  }>;
  draft: {
    indexName: string;
    method: string;
    columns: string[];
    unique: boolean;
  };
  isCreating: boolean;
  isDropping: boolean;
  onChangeDraft: (draft: Partial<TableDesignPanelProps['draft']>) => void;
  onCreateIndex: () => void;
  onDropIndex: (indexName: string) => void;
}

const TableDesignPanel: React.FC<TableDesignPanelProps> = ({
  structureLoading,
  columns,
  indexesLoading,
  indexes,
  columnOptions,
  draft,
  isCreating,
  isDropping,
  onChangeDraft,
  onCreateIndex,
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
            children: <StructurePanel loading={structureLoading} columns={columns} />,
          },
          {
            key: 'indexes',
            label: t('pgsql.indexes'),
            children: (
              <IndexesPanel
                loading={indexesLoading}
                indexes={indexes}
                columnOptions={columnOptions}
                draft={draft}
                isCreating={isCreating}
                isDropping={isDropping}
                onChangeDraft={onChangeDraft}
                onCreateIndex={onCreateIndex}
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
