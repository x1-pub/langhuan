import React from 'react';

import RawDataDisplay from '@/components/raw-data-display';

interface MySQLRawDataDisplayProps {
  type: string;
  value?: unknown;
}

const MySQLRawDataDisplay: React.FC<MySQLRawDataDisplayProps> = props => {
  return <RawDataDisplay engine="mysql" {...props} />;
};

export default MySQLRawDataDisplay;
