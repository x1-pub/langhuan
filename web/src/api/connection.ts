import request from "@/utils/request";

export type ConnectionType = 'mysql' | 'redis' | 'mongodb'

export interface Connection {
  connectionId: number;
  connectionName: string;
  connectionType: ConnectionType;
}

export interface CreateConnectionParams {
  type: ConnectionType;
  name: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  database?: string;
}

export const getConnectionList = () => request<Connection[]>({
  method: 'GET',
  url: '/api/connection/connection_list',
})

export const createConnection = (data: CreateConnectionParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/connection/create_connection',
})

export interface ConnectionDetails extends CreateConnectionParams {
  id: number;
  createdAt: string;
  updatedAt: string;
  database: string;
}

export const getConnectionDetails = (connectionId: number | string) => request<ConnectionDetails>({
  method: 'GET',
  params: { connectionId },
  url: '/api/connection/connection_details',
})

interface ModifyConnectionParams extends CreateConnectionParams {
  id: string | number;
}
export const modifyConnection = (data: ModifyConnectionParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/connection/modify_connection',
})

export const deleteConnection = (id: string | number) => request<void>({
  method: 'POST',
  data: { id },
  url: '/api/connection/delete_connection',
})

interface TestConnectionParams extends CreateConnectionParams {
  id?: string | number;
}
export const testConnection = (data: TestConnectionParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/connection/test_connection',
})
