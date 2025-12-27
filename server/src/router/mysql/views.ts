import z from 'zod';
import { QueryTypes, Sequelize } from 'sequelize';

import {
  BaseViewSchema,
  DeleteViewSchema,
  GetViewsSchema,
  UpdateViewSchema,
} from '@packages/zod/mysql';
import { EMySQLViewCheckOption, EMysqlFunctionSecurity } from '@packages/types/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';

interface IOriginView {
  name: string;
  definer: string;
  checkOption: EMySQLViewCheckOption;
  security: EMysqlFunctionSecurity;
  definition: string;
  isUpdatable: 'YES' | 'NO';
}

const createViewSQL = (instance: Sequelize, params: z.infer<typeof BaseViewSchema>) => {
  const { name, definition, algorithm, definer, security, comment, checkOption } = params;

  const viewName = escapedMySQLName(name, instance);
  const algorithmSQL = algorithm ? `ALGORITHM=${algorithm}` : '';
  const definerSQL = buildDefinerSQL(definer, instance);
  const securitySQL = security ? `SQL SECURITY ${security}` : '';
  const commentSQL = comment ? `COMMENT ${instance.escape(comment)}` : '';
  const checkOptionSQL = checkOption ? `WITH ${checkOption} CHECK OPTION` : '';
  const trimmedDefinition = definition.trim();

  const parts = [
    algorithmSQL,
    definerSQL,
    securitySQL,
    'VIEW',
    viewName,
    'AS',
    trimmedDefinition,
    commentSQL,
    checkOptionSQL,
  ]
    .filter(Boolean)
    .join(' ');

  return `CREATE ${parts}`;
};

const buildDefinerSQL = (definer: string | undefined, instance: Sequelize) => {
  if (!definer) return '';
  const [user, host] = definer.split('@');
  if (host) {
    const escapedUser = instance.escape(user);
    const escapedHost = instance.escape(host);
    return `DEFINER=${escapedUser}@${escapedHost}`;
  }
  return `DEFINER=${definer}`;
};

const mysqlViewsRouter = router({
  getViews: protectedProcedure.input(GetViewsSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const views: IOriginView[] = await instance.query(
      `
      SELECT
        TABLE_NAME AS name,
        DEFINER AS definer,
        CHECK_OPTION AS checkOption,
        SECURITY_TYPE AS security,
        VIEW_DEFINITION AS definition,
        IS_UPDATABLE AS isUpdatable
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME;
    `,
      {
        replacements: [dbName],
        type: QueryTypes.SELECT,
      },
    );

    return views.map(v => ({
      connectionId,
      dbName,
      name: v.name,
      definer: v.definer,
      checkOption: v.checkOption,
      security: v.security,
      definition: v.definition,
      comment: undefined,
      algorithm: undefined,
      isUpdatable: v.isUpdatable,
    }));
  }),

  createView: protectedProcedure.input(BaseViewSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const createSQL = createViewSQL(instance, input);

    await instance.query(createSQL);
    return null;
  }),

  updateView: protectedProcedure.input(UpdateViewSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name, oldName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const dropName = escapedMySQLName(oldName || name, instance);
    const createSQL = createViewSQL(instance, input);

    const transaction = await instance.transaction();
    try {
      await instance.query(`DROP VIEW IF EXISTS ${dropName};`, { transaction });
      await instance.query(createSQL, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return null;
  }),

  deleteView: protectedProcedure.input(DeleteViewSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedName = escapedMySQLName(name, instance);
    await instance.query(`DROP VIEW IF EXISTS ${escapedName};`);

    return null;
  }),
});

export default mysqlViewsRouter;
