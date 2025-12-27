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
import { EMysqlFunctionDataAccess, EMysqlFunctionSecurity } from '@packages/types/mysql';

interface IOriginFunction {
  function_name: string;
  returns: string;
  params_raw?: string | null;
  is_deterministic: 'YES' | 'NO';
  sql_data_access: EMysqlFunctionDataAccess;
  security_type: EMysqlFunctionSecurity;
  definer: string;
  comment: string;
  body: string;
}

const FUNCTION_PARAMS_SEPARATOR = '{LANGHUAN_FUNCTION_PARAMS_SEPARATOR_18sdfl1a9012klnz@12309}';
const GET_FUNCTIONS_SQL = `
  SELECT
    r.ROUTINE_SCHEMA AS db_name,
    r.ROUTINE_NAME AS function_name,
    GROUP_CONCAT(
      CONCAT(
        CASE WHEN p.PARAMETER_MODE IS NULL THEN '' ELSE ' ' END,
        p.PARAMETER_NAME, ' ',
        p.DTD_IDENTIFIER
      )
      ORDER BY p.ORDINAL_POSITION
      SEPARATOR '${FUNCTION_PARAMS_SEPARATOR}'
    ) AS params_raw,
    r.DTD_IDENTIFIER AS returns,
    r.IS_DETERMINISTIC AS is_deterministic,
    r.SQL_DATA_ACCESS AS sql_data_access,
    r.SECURITY_TYPE AS security_type,
    r.DEFINER AS definer,
    r.ROUTINE_COMMENT AS comment,
    r.ROUTINE_DEFINITION AS body,
    r.CREATED AS created_at,
    r.LAST_ALTERED AS updated_at
  FROM information_schema.ROUTINES r
  LEFT JOIN information_schema.PARAMETERS p
    ON p.SPECIFIC_SCHEMA = r.ROUTINE_SCHEMA
    AND p.SPECIFIC_NAME = r.ROUTINE_NAME
    AND p.ROUTINE_TYPE = 'FUNCTION'
  WHERE r.ROUTINE_SCHEMA = ?
    AND r.ROUTINE_TYPE = 'FUNCTION'
  GROUP BY
    r.ROUTINE_SCHEMA,
    r.ROUTINE_NAME,
    r.DTD_IDENTIFIER,
    r.IS_DETERMINISTIC,
    r.SQL_DATA_ACCESS,
    r.SECURITY_TYPE,
    r.DEFINER,
    r.ROUTINE_COMMENT,
    r.ROUTINE_DEFINITION,
    r.CREATED,
    r.LAST_ALTERED
  ORDER BY r.ROUTINE_NAME;
`;

const parseParams = (raw: IOriginFunction['params_raw']) => {
  if (!raw) return undefined;
  const cleaned = `${raw}`
    .split(FUNCTION_PARAMS_SEPARATOR)
    .map(s => s.trim())
    .filter(Boolean)
    .map(str => {
      const idx = str.indexOf(' ');
      if (idx === -1) return { name: str, type: '' };
      return { name: str.slice(0, idx), type: str.slice(idx + 1) };
    })
    .filter(p => p.name || p.type);
  return cleaned.length ? cleaned : undefined;
};

const mysqlFunctionsRouter = router({
  getFunctions: protectedProcedure.input(GetFunctionsSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const functions: IOriginFunction[] = await instance.query(GET_FUNCTIONS_SQL, {
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
      params: parseParams(fun.params_raw),
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
