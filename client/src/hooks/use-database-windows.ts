import { createContext, useContext, useEffect, useState } from 'react';

import { EConnectionType } from '@packages/types/connection';

const CONNECTOR = `(${''.padStart(64, '@')})`;

export enum ESpecialWind {
  MYSQL_ENENT = 'MYSQL_ENENT',
  MYSQL_FUNCTION = 'MYSQL_FUNCTION',
  MYSQL_VIEW = 'MYSQL_VIEW',
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

export const generateActiveId = (
  dbName: string,
  tableName: string = 'NO_TABLE',
  specialWind?: ESpecialWind,
) => {
  return `${dbName}${CONNECTOR}${tableName}${CONNECTOR}${specialWind || ''}`;
};

export const parseActiveId = (activeId: string) => {
  const [dbName, tableName, specialWind] = activeId.split(CONNECTOR);
  return { dbName, tableName, specialWind };
};

const useDatabaseWindows = () => {
  const context = useContext(DatabaseWindowsContext);
  const { dbName, tableName } = parseActiveId(context.active);
  const [value, setValue] = useState<typeof context & { dbName: string; tableName: string }>({
    ...context,
    dbName,
    tableName,
  });

  useEffect(() => {
    setValue({ ...value, ...context });
  }, [context]);

  return value;
};

export default useDatabaseWindows;
