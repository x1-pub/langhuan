import { createContext, useContext } from "react"

import { ConnectionType } from "@/api/connection";

export interface IWind {
  dbName: string;
  tableName?: string;
}

interface IDatabaseContext {
  connectionType: ConnectionType;
  connectionId: string;
  wind: IWind[];
  setWind: (w: IWind[]) => void;
  active: string;
  setActive: (k: string) => void
}

export const DatabaseContext = createContext<IDatabaseContext>({
  connectionType: 'mysql',
  connectionId: '',
  wind: [],
  setWind: () => {},
  active: '',
  setActive: () => {}
});

export const generateActiveId = (dbName: string, tableName: string | undefined) => {
  return JSON.stringify({ dbName, tableName })
}

export const parseActiveId = (activeId: string) => {
  try {
    return JSON.parse(activeId) as { dbName: string, tableName: string }
  } catch (_err) {
    return {
      dbName: '',
      tableName: '',
    }
  }
}

const useMain = () => {
  const value = useContext(DatabaseContext)
  const { dbName, tableName } = parseActiveId(value.active)
  return { ...value, dbName, tableName }
}

export default useMain