import React, { Suspense } from 'react';
import { Spin, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import styles from './index.module.less';

const LazyCodeEditor = React.lazy(() => import('@/components/code-editor'));

interface SqlWhereEditorProps {
  value: string;
  fields: string[];
  keywords?: string[];
  tips: React.ReactNode;
  onChange: (value?: string) => void;
}

const SqlWhereEditor: React.FC<SqlWhereEditorProps> = ({
  value,
  fields,
  keywords = [],
  tips,
  onChange,
}) => (
  <div className={styles.whereEditor}>
    <div className={styles.editor}>
      <Suspense fallback={<Spin size="small" className={styles.loading} />}>
        <LazyCodeEditor
          language="sql"
          showLineNumbers={false}
          value={value}
          onChange={onChange}
          fields={fields}
          keywords={keywords}
        />
      </Suspense>
    </div>
    <Tooltip
      placement="right"
      title={tips}
      styles={{ container: { width: 'var(--layout-query-help-width)' } }}
    >
      <QuestionCircleOutlined className={styles.help} />
    </Tooltip>
  </div>
);

export default SqlWhereEditor;
