import { createContext, useContext } from 'react';

import { EConnectionType } from '@packages/types/connection';

export interface IWind {
  dbName: string;
  tableName?: string;
}

interface IDatabaseContext {
  connectionType: EConnectionType;
  connectionId: number;
  wind: IWind[];
  setWind: (w: IWind[]) => void;
  active: string;
  setActive: (k: string) => void;
}

export const DatabaseContext = createContext<IDatabaseContext>({
  connectionType: EConnectionType.MYSQL,
  connectionId: 0,
  wind: [],
  setWind: () => {},
  active: '',
  setActive: () => {},
});

export const generateActiveId = (dbName: string, tableName: string = 'redis_no_table') => {
  return `${dbName}::${tableName}`;
};

export const parseActiveId = (activeId: string) => {
  const [dbName, tableName] = activeId.split('::');
  return { dbName, tableName };
};

const useMain = () => {
  const value = useContext(DatabaseContext);
  const { dbName, tableName } = parseActiveId(value.active);
  return { ...value, dbName, tableName };
};

export default useMain;
