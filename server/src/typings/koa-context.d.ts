import 'koa';

export interface IRsp<T = any> {
  data: T;
  code: number;
  message: string;
}
declare module 'koa' {
  interface Context {
    params: Record<string, string>;
    user: {
      id: number;
      name: string;
      nameCn: string;
      email: string;
    };

    /**
     * 格式化并返回消息 ctx.body = { code, message, data }
     * @param op Partial<{ data, code, message }>
     * @returns void
     */
    r: (op?: Partial<IRsp>) => void
  }
}