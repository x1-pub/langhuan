import request from "@/utils/request";

export interface Table {
  name: string;
  comment: string;
}

interface BaseTableParams {
  connectionId: string;
  dbName: string;
}

export const getTableList = (params: BaseTableParams) => request<Table[]>({
  method: 'GET',
  params,
  url: '/api/table/table_list',
})

interface CreateOrDeleteTableParams extends BaseTableParams {
  tableName: string;
  comment?: string;
}
export const createTable = (data: CreateOrDeleteTableParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/table/create_table',
})

export const deleteTable = (data: CreateOrDeleteTableParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/table/delete_table',
})

interface ModifyTableParams extends CreateOrDeleteTableParams {
  newTableName: string
}
export const modifyTable = (data: ModifyTableParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/table/modify_table',
})
