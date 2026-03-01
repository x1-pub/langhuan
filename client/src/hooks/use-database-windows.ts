import { createContext, useContext } from 'react';

import { EConnectionType } from '@packages/types/connection';

const CONNECTOR = `(${''.padStart(64, '@')})`;

export enum ESpecialWind {
  MYSQL_EVENT = 'MYSQL_EVENT',
  MYSQL_FUNCTION = 'MYSQL_FUNCTION',
  MYSQL_VIEW = 'MYSQL_VIEW',
  PGSQL_FUNCTION = 'PGSQL_FUNCTION',
  PGSQL_VIEW = 'PGSQL_VIEW',
  PGSQL_EVENT = 'PGSQL_EVENT',
}

export interface IWind {
  dbName: string;
  tableName?: string;
  specialWind?: ESpecialWind;
}

interface IDatabaseWindowsContext {
  connectionType: EConnectionType;
  connectionId: number;
  wind: IWind[];
  setWind: (w: IWind[]) => void;
  active: string;
  setActive: (k: string) => void;
}

export const DatabaseWindowsContext = createContext<IDatabaseWindowsContext>({
  connectionType: EConnectionType.MYSQL,
  connectionId: 0,
  wind: [],
  setWind: () => {},
  active: '',
  setActive: () => {},
});

export const generateActiveId = (wind: IWind) => {
  return `${wind.dbName}${CONNECTOR}${wind.tableName || 'NO_TABLE'}${CONNECTOR}${wind.specialWind || ''}`;
};

export const parseActiveId = (activeId: string) => {
  const [dbName = '', tableName = 'NO_TABLE', specialWind = ''] = (activeId || '').split(CONNECTOR);
  return {
    dbName,
    tableName,
    specialWind: specialWind === 'MYSQL_ENENT' ? ESpecialWind.MYSQL_EVENT : specialWind,
  };
};

const useDatabaseWindows = () => {
  const context = useContext(DatabaseWindowsContext);
  const { dbName, tableName } = parseActiveId(context.active);
  return {
    ...context,
    dbName,
    tableName,
  };
};

export default useDatabaseWindows;
