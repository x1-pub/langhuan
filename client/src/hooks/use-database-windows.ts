import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';

import { EConnectionType } from '@packages/types/connection';

const ACTIVE_ID_SEPARATOR = `(${''.padStart(64, '@')})`;
export const NO_TABLE_NAME = 'NO_TABLE' as const;

export enum ESpecialWind {
  MYSQL_EVENT = 'MYSQL_EVENT',
  MYSQL_FUNCTION = 'MYSQL_FUNCTION',
  MYSQL_VIEW = 'MYSQL_VIEW',
  PGSQL_FUNCTION = 'PGSQL_FUNCTION',
  PGSQL_VIEW = 'PGSQL_VIEW',
  PGSQL_EVENT = 'PGSQL_EVENT',
}
const LEGACY_SPECIAL_WINDOW_MAP: Record<string, ESpecialWind> = {
  MYSQL_ENENT: ESpecialWind.MYSQL_EVENT,
};
const SPECIAL_WINDOW_VALUES = new Set(Object.values(ESpecialWind));

export interface IWind {
  dbName: string;
  tableName?: string;
  specialWind?: ESpecialWind;
}
export type DatabaseWindow = IWind;
export type SpecialWindow = ESpecialWind;

interface IDatabaseWindowsContext {
  connectionType: EConnectionType;
  connectionId: number;
  wind: IWind[];
  setWind: Dispatch<SetStateAction<IWind[]>>;
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
}

const noopSetWind: Dispatch<SetStateAction<IWind[]>> = () => undefined;
const noopSetActive: Dispatch<SetStateAction<string>> = () => undefined;

export const DatabaseWindowsContext = createContext<IDatabaseWindowsContext>({
  connectionType: EConnectionType.MYSQL,
  connectionId: 0,
  wind: [],
  setWind: noopSetWind,
  active: '',
  setActive: noopSetActive,
});

export const generateActiveId = (wind: IWind) => {
  return `${wind.dbName}${ACTIVE_ID_SEPARATOR}${wind.tableName || NO_TABLE_NAME}${ACTIVE_ID_SEPARATOR}${wind.specialWind || ''}`;
};

const normalizeSpecialWindow = (value: string): ESpecialWind | undefined => {
  const normalizedValue = LEGACY_SPECIAL_WINDOW_MAP[value] || value;
  if (SPECIAL_WINDOW_VALUES.has(normalizedValue as ESpecialWind)) {
    return normalizedValue as ESpecialWind;
  }
  return undefined;
};

export const parseActiveId = (activeId: string) => {
  const [dbName = '', tableName = NO_TABLE_NAME, specialWindowKey = ''] = (activeId || '').split(
    ACTIVE_ID_SEPARATOR,
  );
  return {
    dbName,
    tableName,
    specialWind: normalizeSpecialWindow(specialWindowKey),
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
