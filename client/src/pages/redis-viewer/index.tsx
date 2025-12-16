import React from 'react';

import TableSwitcher from '@/components/table-switcher';
import RedisMain from './components';

const RedisViewer: React.FC = () => {
  return (
    <TableSwitcher>
      <RedisMain />
    </TableSwitcher>
  );
};

export default RedisViewer;
