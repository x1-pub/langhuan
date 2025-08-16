import request from "@/utils/request";

interface ExecuteMongoCommandParams {
  connectionId: number;
  command: string;
}

export const executeMongoCommand = (data: ExecuteMongoCommandParams) => request<{ result: string, changeDatabase?: string; }>({
  method: 'POST',
  data,
  url: '/api/mongo/mongo_execute',
})
