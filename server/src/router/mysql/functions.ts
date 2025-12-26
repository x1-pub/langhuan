import { QueryTypes } from 'sequelize';
import z from 'zod';

import {
  BaseFunctionSchema,
  DeleteFunctionSchema,
  GetFunctionsSchema,
  UpdateFunctionSchema,
} from '@packages/zod/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';
import { generateMySQLGetFunctionsSQL } from '../../lib/mysql-sql-generator';
import { EMysqlFunctionDataAccess, EMysqlFunctionSecurity } from '@packages/types/mysql';

interface IOriginFunction {
  function_name: string;
  returns: string;
  params?: string;
  is_deterministic: 'YES' | 'NO';
  sql_data_access: EMysqlFunctionDataAccess;
  security_type: EMysqlFunctionSecurity;
  definer: string;
  comment: string;
  body: string;
}

const mysqlFunctionsRouter = router({
  getFunctions: protectedProcedure.input(GetFunctionsSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const sql = generateMySQLGetFunctionsSQL();
    const functions: IOriginFunction[] = await instance.query(sql, {
      replacements: [dbName],
      type: QueryTypes.SELECT,
    });

    const result: z.infer<typeof BaseFunctionSchema>[] = functions.map(fun => ({
      connectionId,
      dbName,
      name: fun.function_name,
      returns: fun.returns,
      body: fun.body,
      deterministic: fun.is_deterministic === 'YES',
      sqlDataAccess: fun.sql_data_access,
      comment: fun.comment,
      security: fun.security_type,
      params: fun.params?.split(',').map(item => {
        const str = item.trim();
        const idx = str.indexOf(' ');
        if (idx === -1) {
          return { name: str, type: '' };
        }

        const name = str.slice(0, idx);
        const type = str.slice(idx + 1);
        return { name, type };
      }),
    }));

    return result;
  }),

  createFunction: protectedProcedure.input(BaseFunctionSchema).mutation(async ({ ctx, input }) => {
    const {
      connectionId,
      dbName,
      params,
      returns,
      body,
      deterministic,
      sqlDataAccess,
      comment,
      name,
      security,
    } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const fnName = escapedMySQLName(name, instance);
    const paramsSQL = params
      ?.map(p => `${escapedMySQLName(p.name, instance)} ${p.type}`)
      .join(', ');
    const deterministicSQL = deterministic === false ? 'NOT DETERMINISTIC' : 'DETERMINISTIC';
    const dataAccessSQL = sqlDataAccess ? sqlDataAccess : '';
    const commentSQL = comment ? `COMMENT ${instance.escape(comment)}` : '';
    const securitySQL = security ? `SQL SECURITY ${security}` : '';
    const trimmedBody = body.trim();

    const createSQL = `CREATE FUNCTION ${fnName} (${paramsSQL}) RETURNS ${returns} ${securitySQL} ${deterministicSQL} ${dataAccessSQL} ${commentSQL} ${trimmedBody}`;

    await instance.query(createSQL);
    return null;
  }),

  updateFunction: protectedProcedure
    .input(UpdateFunctionSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        connectionId,
        dbName,
        name,
        oldName,
        params,
        returns,
        body,
        deterministic,
        sqlDataAccess,
        comment,
        security,
      } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const fnName = escapedMySQLName(name, instance);
      const dropName = escapedMySQLName(oldName || name, instance);
      const paramsSQL = params
        ?.map(p => `${escapedMySQLName(p.name, instance)} ${p.type}`)
        .join(', ');
      const deterministicSQL = deterministic === false ? 'NOT DETERMINISTIC' : 'DETERMINISTIC';
      const dataAccessSQL = sqlDataAccess ? sqlDataAccess : '';
      const commentSQL = comment ? `COMMENT ${instance.escape(comment)}` : '';
      const securitySQL = security ? `SQL SECURITY ${security}` : '';
      const trimmedBody = body.trim();

      const createSQL = `CREATE FUNCTION ${fnName} (${paramsSQL}) RETURNS ${returns} ${securitySQL} ${deterministicSQL} ${dataAccessSQL} ${commentSQL} ${trimmedBody}`;

      const transaction = await instance.transaction();
      try {
        await instance.query(`DROP FUNCTION IF EXISTS ${dropName};`, { transaction });
        await instance.query(createSQL, { transaction });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      return null;
    }),

  deleteFunction: protectedProcedure
    .input(DeleteFunctionSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, name } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedName = escapedMySQLName(name, instance);
      await instance.query(`DROP FUNCTION IF EXISTS ${escapedName};`);

      return null;
    }),
});

export default mysqlFunctionsRouter;
