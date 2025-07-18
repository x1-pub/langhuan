import request from "@/utils/request";

export interface Database {
  name: string;
  charset: string;
  collation: string;
}

export const getDBList = (connectionId: string) => request<Database[]>({
  method: 'GET',
  params: { connectionId },
  url: '/api/db/db_list',
})

export const deleteDB = (connectionId: string, dbName: string) => request<void>({
  method: 'POST',
  data: { connectionId, dbName },
  url: '/api/db/delete_db',
})

interface CreateDBParams {
  connectionId: string
  dbName: string;
  charset?: string;
  collation?: string;
}

export const createDB = (data: CreateDBParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/db/create_db',
})

export const modifyDB = (data: CreateDBParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/db/modify_db',
})
