import React from 'react';

import TableSwitcher from '@/components/table-switcher';
import Viewer from './components/viewer';

const MongodbCollectionViewer: React.FC = () => {
  return (
    <TableSwitcher>
      <Viewer />
    </TableSwitcher>
  );
};

export default MongodbCollectionViewer;
