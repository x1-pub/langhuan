import {
  buildWindowId,
  type DatabaseWindow,
  type ESpecialWind,
} from '../state/database-window-state';

export const getInitialActiveWindowId = (windows: DatabaseWindow[]) => {
  return windows.length > 0 ? buildWindowId(windows[0]) : '';
};

export const removeWindowsByDatabase = (windows: DatabaseWindow[], databaseName: string) => {
  return windows.filter(window => window.dbName !== databaseName);
};

export const removeWindowsByTable = (
  windows: DatabaseWindow[],
  databaseName: string,
  tableName: string,
) => {
  return windows.filter(
    window => !(window.dbName === databaseName && window.tableName === tableName),
  );
};

export const resolveActiveWindowId = (windows: DatabaseWindow[], currentActiveId: string) => {
  if (!currentActiveId) {
    return getInitialActiveWindowId(windows);
  }

  const activeStillExists = windows.some(window => buildWindowId(window) === currentActiveId);
  return activeStillExists ? currentActiveId : getInitialActiveWindowId(windows);
};

export const appendWindowIfMissing = (
  windows: DatabaseWindow[],
  payload: {
    dbName: string;
    tableName?: string;
    specialWind?: ESpecialWind;
  },
) => {
  const candidate: DatabaseWindow = {
    dbName: payload.dbName,
    tableName: payload.tableName,
    specialWind: payload.specialWind,
  };
  const nextActiveId = buildWindowId(candidate);
  const alreadyOpened = windows.some(window => buildWindowId(window) === nextActiveId);

  return {
    windows: alreadyOpened ? windows : [...windows, candidate],
    activeId: nextActiveId,
  };
};
