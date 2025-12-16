import React from 'react';

import TableSwitcher from '@/components/table-switcher';
import Viewer from './viewer';

const MongodbViewer: React.FC = () => {
  return (
    <TableSwitcher>
      <Viewer />
    </TableSwitcher>
  );
};

export default MongodbViewer;
