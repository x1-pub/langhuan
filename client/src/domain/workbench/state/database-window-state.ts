import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';

import { EConnectionType } from '@packages/types/connection';

const WINDOW_ID_SEPARATOR = `(${''.padStart(64, '@')})`;
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

export interface DatabaseWindow {
  dbName: string;
  tableName?: string;
  specialWind?: ESpecialWind;
}

export type IWind = DatabaseWindow;
export type SpecialWindow = ESpecialWind;

export interface DatabaseWindowsContextValue {
  connectionType: EConnectionType;
  connectionId: number;
  wind: DatabaseWindow[];
  setWind: Dispatch<SetStateAction<DatabaseWindow[]>>;
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
}

const noopSetWind: Dispatch<SetStateAction<DatabaseWindow[]>> = () => undefined;
const noopSetActive: Dispatch<SetStateAction<string>> = () => undefined;

export const DatabaseWindowsContext = createContext<DatabaseWindowsContextValue>({
  connectionType: EConnectionType.MYSQL,
  connectionId: 0,
  wind: [],
  setWind: noopSetWind,
  active: '',
  setActive: noopSetActive,
});

export const buildWindowId = (window: DatabaseWindow) => {
  return `${window.dbName}${WINDOW_ID_SEPARATOR}${window.tableName || NO_TABLE_NAME}${WINDOW_ID_SEPARATOR}${window.specialWind || ''}`;
};

const normalizeSpecialWindow = (value: string): ESpecialWind | undefined => {
  const normalizedValue = LEGACY_SPECIAL_WINDOW_MAP[value] || value;
  if (SPECIAL_WINDOW_VALUES.has(normalizedValue as ESpecialWind)) {
    return normalizedValue as ESpecialWind;
  }

  return undefined;
};

export const parseWindowId = (windowId: string) => {
  const [dbName = '', tableName = NO_TABLE_NAME, specialWindowKey = ''] = (windowId || '').split(
    WINDOW_ID_SEPARATOR,
  );

  return {
    dbName,
    tableName,
    specialWind: normalizeSpecialWindow(specialWindowKey),
  };
};

// Backward compatibility for existing feature modules.
export const generateActiveId = buildWindowId;
export const parseActiveId = parseWindowId;

const useDatabaseWindows = () => {
  const context = useContext(DatabaseWindowsContext);
  const { dbName, tableName } = parseWindowId(context.active);

  return {
    ...context,
    dbName,
    tableName,
  };
};

export default useDatabaseWindows;
