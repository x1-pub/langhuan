import React from 'react';

import TableSwitcher from '@/components/table-switcher';
import { ESpecialWind, IWind } from '@/hooks/use-database-windows';
import Viewer from './components/viewer';
import DatabaseFunction from './components/database-function';
import DatabaseView from './components/database-view';
import DatabaseEvent from './components/database-event';

const PgsqlViewer: React.FC = () => {
  const renderWind = (wind: IWind) => {
    switch (wind.specialWind) {
      case ESpecialWind.PGSQL_FUNCTION:
        return <DatabaseFunction />;
      case ESpecialWind.PGSQL_VIEW:
        return <DatabaseView />;
      case ESpecialWind.PGSQL_EVENT:
        return <DatabaseEvent />;
      default:
        return <Viewer />;
    }
  };

  return <TableSwitcher>{renderWind}</TableSwitcher>;
};

export default PgsqlViewer;
