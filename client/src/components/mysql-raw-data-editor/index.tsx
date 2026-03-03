import React from 'react';
import type { TMySQLProcessedData, TMySQLRawData } from '@packages/types/mysql';

import RawDataEditor from '@/components/raw-data-editor';

interface MySQLRawDataEditorProps {
  type: string;
  value?: TMySQLRawData;
  style?: React.CSSProperties;
  onChange?: (value: TMySQLProcessedData) => void;
}

const MySQLRawDataEditor: React.FC<MySQLRawDataEditorProps> = props => {
  return (
    <RawDataEditor
      engine="mysql"
      type={props.type}
      value={props.value}
      style={props.style}
      onChange={value => props.onChange?.(value as TMySQLProcessedData)}
    />
  );
};

export default MySQLRawDataEditor;
