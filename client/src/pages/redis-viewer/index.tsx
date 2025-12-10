import React from 'react';

import ViewerTabs from '@/components/table-tabs';
import RedisMain from './components';

const RedisViewer: React.FC = () => {
  return (
    <ViewerTabs>
      <RedisMain />
    </ViewerTabs>
  );
};

export default RedisViewer;
