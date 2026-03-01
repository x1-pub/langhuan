import { TRPCError } from '@trpc/server';
import {
  CreatePgsqlEventTriggerSchema,
  CreatePgsqlFunctionSchema,
  CreatePgsqlTableIndexSchema,
  CreatePgsqlTablePartitionSchema,
  CreatePgsqlTableTriggerSchema,
  CreatePgsqlViewSchema,
  DeletePgsqlEventTriggerSchema,
  DeletePgsqlFunctionSchema,
  DeletePgsqlRowsSchema,
  DeletePgsqlTablePartitionSchema,
  DeletePgsqlTableTriggerSchema,
  DeletePgsqlViewSchema,
  DropPgsqlTableIndexSchema,
  GetPgsqlEventTriggersSchema,
  GetPgsqlFunctionsSchema,
  GetPgsqlTablePartitionsSchema,
  GetPgsqlTableTriggersSchema,
  GetPgsqlTableColumnsSchema,
  GetPgsqlTableDataSchema,
  GetPgsqlTableDDLSchema,
  GetPgsqlTableIndexesSchema,
  GetPgsqlTableStatsSchema,
  GetPgsqlViewsSchema,
  InsertPgsqlRowSchema,
  UpdatePgsqlEventTriggerSchema,
  UpdatePgsqlFunctionSchema,
  UpdatePgsqlTablePartitionSchema,
  UpdatePgsqlTableTriggerSchema,
  UpdatePgsqlViewSchema,
  UpdatePgsqlRowSchema,
} from '@packages/zod/pgsql';
import { Pool, PoolClient } from 'pg';

import {
  normalizePgsqlRow,
  parsePgsqlJsonObject,
  parsePgsqlQualifiedTableName,
  quotePgsqlIdentifier,
  validatePgsqlSqlFragment,
} from '../lib/pgsql';
import { protectedProcedure, router } from '../trpc';

interface IPgsqlColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
}

const pgsqlVersionCache = new WeakMap<Pool, number>();

const getPgsqlServerVersionNum = async (pool: Pool) => {
  const cached = pgsqlVersionCache.get(pool);
  if (cached) {
    return cached;
  }

  const versionNumResult = await pool.query<{ server_version_num: string }>(
    'SHOW server_version_num',
  );
  const parsedVersion = Number(versionNumResult.rows[0]?.server_version_num || 0);

  if (!Number.isFinite(parsedVersion) || parsedVersion <= 0) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to resolve PostgreSQL server version.',
    });
  }

  pgsqlVersionCache.set(pool, parsedVersion);
  return parsedVersion;
};

const getPgsqlTableContext = async (
  getPgsqlInstance: (connectionId: number, databaseName?: string, pageId?: string) => Promise<Pool>,
  input: {
    connectionId: number;
    dbName: string;
    tableName: string;
  },
) => {
  const pool = await getPgsqlInstance(input.connectionId, input.dbName);
  const parsed = parsePgsqlQualifiedTableName(input.tableName);

  return {
    pool,
    ...parsed,
    qualifiedTableName: `${parsed.quotedSchemaName}.${parsed.quotedTableName}`,
  };
};

const getPgsqlColumns = async (
  pool: Pool,
  schemaName: string,
  tableName: string,
  serverVersionNum?: number,
) => {
  const versionNum = serverVersionNum ?? (await getPgsqlServerVersionNum(pool));
  const hasIdentityColumns = versionNum >= 100000;
  const identitySelect = hasIdentityColumns
    ? `cols.is_identity = 'YES' AS "isIdentity",
        NULLIF(cols.identity_generation, '') AS "identityGeneration",`
    : `FALSE AS "isIdentity",
        NULL::text AS "identityGeneration",`;

  const { rows } = await pool.query<IPgsqlColumn>(
    `
      SELECT
        cols.column_name AS "name",
        pg_catalog.format_type(attrs.atttypid, attrs.atttypmod) AS "dataType",
        cols.is_nullable = 'YES' AS "nullable",
        cols.column_default AS "defaultValue",
        ${identitySelect}
        pg_catalog.col_description(
          (quote_ident(cols.table_schema) || '.' || quote_ident(cols.table_name))::regclass,
          cols.ordinal_position
        ) AS "comment",
        COALESCE(pk.is_primary_key, FALSE) AS "isPrimaryKey"
      FROM information_schema.columns cols
      JOIN pg_class tbl
        ON tbl.relname = cols.table_name
      JOIN pg_namespace ns
        ON ns.oid = tbl.relnamespace
       AND ns.nspname = cols.table_schema
      JOIN pg_attribute attrs
        ON attrs.attrelid = tbl.oid
       AND attrs.attname = cols.column_name
       AND attrs.attnum > 0
       AND NOT attrs.attisdropped
      LEFT JOIN (
        SELECT
          kcu.table_schema,
          kcu.table_name,
          kcu.column_name,
          TRUE AS is_primary_key
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
         AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk
        ON pk.table_schema = cols.table_schema
       AND pk.table_name = cols.table_name
       AND pk.column_name = cols.column_name
      WHERE cols.table_schema = $1
        AND cols.table_name = $2
      ORDER BY cols.ordinal_position
    `,
    [schemaName, tableName],
  );

  return rows;
};

const getPgsqlDatabasePool = async (
  getPgsqlInstance: (connectionId: number, databaseName?: string, pageId?: string) => Promise<Pool>,
  input: {
    connectionId: number;
    dbName: string;
  },
) => {
  return getPgsqlInstance(input.connectionId, input.dbName);
};

const mapPartitionStrategy = (value: string) => {
  if (value === 'r') {
    return 'RANGE';
  }
  if (value === 'l') {
    return 'LIST';
  }
  if (value === 'h') {
    return 'HASH';
  }

  return value || '-';
};

const withPgsqlTransaction = async (pool: Pool, fn: (client: PoolClient) => Promise<void>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const normalizeRequiredDefinition = (definition: string, fieldName: string) => {
  const trimmed = definition.trim();
  if (!trimmed) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} cannot be empty.`,
    });
  }

  return trimmed;
};

const parseObjectWithDefaultSchema = (rawName: string, defaultSchema: string) => {
  if (rawName.includes('.')) {
    return parsePgsqlQualifiedTableName(rawName);
  }

  return parsePgsqlQualifiedTableName(`${defaultSchema}.${rawName}`);
};

const getRoutineDropKeyword = (kind?: string) => {
  const normalized = String(kind || '').toUpperCase();
  if (normalized === 'PROCEDURE') {
    return 'PROCEDURE';
  }
  if (normalized === 'AGGREGATE') {
    return 'AGGREGATE';
  }

  return 'FUNCTION';
};

export const pgsqlRouter = router({
  getFunctions: protectedProcedure.input(GetPgsqlFunctionsSchema).query(async ({ ctx, input }) => {
    const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
    const serverVersionNum = await getPgsqlServerVersionNum(pool);
    const kindSql =
      serverVersionNum >= 110000
        ? `CASE p.prokind
              WHEN 'f' THEN 'FUNCTION'
              WHEN 'p' THEN 'PROCEDURE'
              WHEN 'a' THEN 'AGGREGATE'
              WHEN 'w' THEN 'WINDOW'
              ELSE p.prokind::text
            END`
        : `CASE
              WHEN p.proisagg THEN 'AGGREGATE'
              WHEN p.proiswindow THEN 'WINDOW'
              ELSE 'FUNCTION'
            END`;
    const { rows } = await pool.query<Record<string, unknown>>(
      `
          SELECT
            n.nspname AS schema,
            p.proname AS name,
            ${kindSql} AS kind,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            pg_get_function_result(p.oid) AS returns,
            l.lanname AS language,
            COALESCE(obj_description(p.oid, 'pg_proc'), '') AS comment,
            pg_get_functiondef(p.oid) AS definition
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          JOIN pg_language l ON l.oid = p.prolang
          WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          ORDER BY n.nspname, p.proname
        `,
    );

    return rows.map((item: Record<string, unknown>) => normalizePgsqlRow(item));
  }),

  createFunction: protectedProcedure
    .input(CreatePgsqlFunctionSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      await pool.query(normalizeRequiredDefinition(input.definition, 'definition'));
      return null;
    }),

  updateFunction: protectedProcedure
    .input(UpdatePgsqlFunctionSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      await pool.query(normalizeRequiredDefinition(input.definition, 'definition'));
      return null;
    }),

  deleteFunction: protectedProcedure
    .input(DeletePgsqlFunctionSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      const schemaName = quotePgsqlIdentifier(input.schemaName, 'schema');
      const functionName = quotePgsqlIdentifier(input.name, 'function');
      const argumentsText = validatePgsqlSqlFragment(input.arguments || '', 'arguments');
      const dropKeyword = getRoutineDropKeyword(input.kind);

      await pool.query(
        `DROP ${dropKeyword} IF EXISTS ${schemaName}.${functionName}(${argumentsText})`,
      );

      return null;
    }),

  getViews: protectedProcedure.input(GetPgsqlViewsSchema).query(async ({ ctx, input }) => {
    const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
    const { rows } = await pool.query<Record<string, unknown>>(
      `
        SELECT
          v.schemaname AS schema,
          v.viewname AS name,
          COALESCE(
            obj_description(
              (quote_ident(v.schemaname) || '.' || quote_ident(v.viewname))::regclass,
              'pg_class'
            ),
            ''
          ) AS comment,
          v.definition AS definition
        FROM pg_views v
        WHERE v.schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY v.schemaname, v.viewname
      `,
    );

    return rows.map((item: Record<string, unknown>) => normalizePgsqlRow(item));
  }),

  createView: protectedProcedure.input(CreatePgsqlViewSchema).mutation(async ({ ctx, input }) => {
    const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
    const schemaName = quotePgsqlIdentifier(input.schemaName, 'schema');
    const viewName = quotePgsqlIdentifier(input.name, 'view');
    const definition = normalizeRequiredDefinition(input.definition, 'definition').replace(
      /;\s*$/,
      '',
    );

    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await pool.query(`CREATE VIEW ${schemaName}.${viewName} AS ${definition}`);
    if (input.comment?.trim()) {
      await pool.query(`COMMENT ON VIEW ${schemaName}.${viewName} IS $1`, [input.comment.trim()]);
    }

    return null;
  }),

  updateView: protectedProcedure.input(UpdatePgsqlViewSchema).mutation(async ({ ctx, input }) => {
    const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
    const oldSchemaName = quotePgsqlIdentifier(input.oldSchemaName, 'schema');
    const oldViewName = quotePgsqlIdentifier(input.oldName, 'view');
    const newSchemaName = quotePgsqlIdentifier(input.schemaName, 'schema');
    const newViewName = quotePgsqlIdentifier(input.name, 'view');
    const definition = normalizeRequiredDefinition(input.definition, 'definition').replace(
      /;\s*$/,
      '',
    );

    await withPgsqlTransaction(pool, async client => {
      await client.query(`CREATE OR REPLACE VIEW ${oldSchemaName}.${oldViewName} AS ${definition}`);

      let currentSchema = input.oldSchemaName;
      let currentName = input.oldName;

      if (input.oldSchemaName !== input.schemaName) {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${newSchemaName}`);
        await client.query(
          `ALTER VIEW ${quotePgsqlIdentifier(currentSchema, 'schema')}.${quotePgsqlIdentifier(currentName, 'view')} SET SCHEMA ${newSchemaName}`,
        );
        currentSchema = input.schemaName;
      }

      if (currentName !== input.name) {
        await client.query(
          `ALTER VIEW ${quotePgsqlIdentifier(currentSchema, 'schema')}.${quotePgsqlIdentifier(currentName, 'view')} RENAME TO ${newViewName}`,
        );
        currentName = input.name;
      }

      const finalName = `${quotePgsqlIdentifier(currentSchema, 'schema')}.${quotePgsqlIdentifier(currentName, 'view')}`;
      if (input.comment?.trim()) {
        await client.query(`COMMENT ON VIEW ${finalName} IS $1`, [input.comment.trim()]);
      } else {
        await client.query(`COMMENT ON VIEW ${finalName} IS NULL`);
      }
    });

    return null;
  }),

  deleteView: protectedProcedure.input(DeletePgsqlViewSchema).mutation(async ({ ctx, input }) => {
    const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
    const schemaName = quotePgsqlIdentifier(input.schemaName, 'schema');
    const viewName = quotePgsqlIdentifier(input.name, 'view');
    await pool.query(`DROP VIEW IF EXISTS ${schemaName}.${viewName}`);
    return null;
  }),

  getEventTriggers: protectedProcedure
    .input(GetPgsqlEventTriggersSchema)
    .query(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      const { rows } = await pool.query<Record<string, unknown>>(
        `
          SELECT
            evtname AS name,
            evtevent AS event,
            CASE evtenabled
              WHEN 'O' THEN 'ENABLED'
              WHEN 'D' THEN 'DISABLED'
              WHEN 'R' THEN 'REPLICA'
              WHEN 'A' THEN 'ALWAYS'
              ELSE evtenabled::text
            END AS status,
            pg_get_event_triggerdef(oid) AS definition
          FROM pg_event_trigger
          ORDER BY evtname
        `,
      );

      return rows.map((item: Record<string, unknown>) => normalizePgsqlRow(item));
    }),

  createEventTrigger: protectedProcedure
    .input(CreatePgsqlEventTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      await pool.query(normalizeRequiredDefinition(input.definition, 'definition'));
      return null;
    }),

  updateEventTrigger: protectedProcedure
    .input(UpdatePgsqlEventTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      const oldName = quotePgsqlIdentifier(input.oldName, 'event trigger');

      await withPgsqlTransaction(pool, async client => {
        await client.query(`DROP EVENT TRIGGER IF EXISTS ${oldName}`);
        await client.query(normalizeRequiredDefinition(input.definition, 'definition'));
      });

      return null;
    }),

  deleteEventTrigger: protectedProcedure
    .input(DeletePgsqlEventTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const pool = await getPgsqlDatabasePool(ctx.pool.getPgsqlInstance, input);
      const name = quotePgsqlIdentifier(input.name, 'event trigger');
      await pool.query(`DROP EVENT TRIGGER IF EXISTS ${name}`);
      return null;
    }),

  getTableData: protectedProcedure.input(GetPgsqlTableDataSchema).query(async ({ ctx, input }) => {
    const { current, pageSize } = input;
    const { pool, schemaName, tableName, qualifiedTableName } = await getPgsqlTableContext(
      ctx.pool.getPgsqlInstance,
      input,
    );
    const serverVersionNum = await getPgsqlServerVersionNum(pool);
    const where = validatePgsqlSqlFragment(input.where, 'where');
    const orderBy = validatePgsqlSqlFragment(input.orderBy, 'orderBy');
    const whereClause = where ? `WHERE ${where}` : '';
    const orderByClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const offset = (current - 1) * pageSize;

    const [columns, countResult, listResult] = await Promise.all([
      getPgsqlColumns(pool, schemaName, tableName, serverVersionNum),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::bigint AS count FROM ${qualifiedTableName} ${whereClause}`,
      ),
      pool.query<Record<string, unknown>>(
        `SELECT ctid::text AS "__pg_ctid", * FROM ${qualifiedTableName} ${whereClause} ${orderByClause} LIMIT $1 OFFSET $2`,
        [pageSize, offset],
      ),
    ]);

    return {
      count: Number(countResult.rows[0]?.count || 0),
      columns,
      list: listResult.rows.map((item: Record<string, unknown>) => normalizePgsqlRow(item)),
    };
  }),

  insertRow: protectedProcedure.input(InsertPgsqlRowSchema).mutation(async ({ ctx, input }) => {
    const { pool, qualifiedTableName } = await getPgsqlTableContext(
      ctx.pool.getPgsqlInstance,
      input,
    );
    const row = parsePgsqlJsonObject(input.row, 'row');
    const entries = Object.entries(row);

    if (entries.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'row cannot be empty.',
      });
    }

    const columns = entries.map(([column]) => quotePgsqlIdentifier(column, 'column'));
    const placeholders = entries.map((_, index) => `$${index + 1}`);
    const values = entries.map(([, value]) => value);

    const result = await pool.query(
      `INSERT INTO ${qualifiedTableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
    );

    return result.rowCount || 0;
  }),

  updateRow: protectedProcedure.input(UpdatePgsqlRowSchema).mutation(async ({ ctx, input }) => {
    const { pool, qualifiedTableName } = await getPgsqlTableContext(
      ctx.pool.getPgsqlInstance,
      input,
    );
    const row = parsePgsqlJsonObject(input.row, 'row');

    delete row.__pg_ctid;
    const entries = Object.entries(row);

    if (entries.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'row cannot be empty.',
      });
    }

    const setClause = entries
      .map(([column], index) => `${quotePgsqlIdentifier(column, 'column')} = $${index + 1}`)
      .join(', ');
    const values = entries.map(([, value]) => value);
    const result = await pool.query(
      `UPDATE ${qualifiedTableName} SET ${setClause} WHERE ctid = $${entries.length + 1}::tid`,
      [...values, input.ctid],
    );

    if (result.rowCount === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'The row to be updated does not exist.',
      });
    }

    return result.rowCount;
  }),

  deleteRows: protectedProcedure.input(DeletePgsqlRowsSchema).mutation(async ({ ctx, input }) => {
    const { pool, qualifiedTableName } = await getPgsqlTableContext(
      ctx.pool.getPgsqlInstance,
      input,
    );
    const placeholders = input.ctids.map((_, index) => `$${index + 1}::tid`).join(', ');
    const result = await pool.query(
      `DELETE FROM ${qualifiedTableName} WHERE ctid IN (${placeholders})`,
      input.ctids,
    );

    return result.rowCount || 0;
  }),

  getTableColumns: protectedProcedure
    .input(GetPgsqlTableColumnsSchema)
    .query(async ({ ctx, input }) => {
      const { pool, schemaName, tableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const serverVersionNum = await getPgsqlServerVersionNum(pool);
      return getPgsqlColumns(pool, schemaName, tableName, serverVersionNum);
    }),

  getTableIndexes: protectedProcedure
    .input(GetPgsqlTableIndexesSchema)
    .query(async ({ ctx, input }) => {
      const { pool, schemaName, tableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const { rows } = await pool.query<{
        name: string;
        definition: string;
      }>(
        `
          SELECT
            indexname AS name,
            indexdef AS definition
          FROM pg_indexes
          WHERE schemaname = $1
            AND tablename = $2
          ORDER BY indexname
        `,
        [schemaName, tableName],
      );

      return rows;
    }),

  getTableTriggers: protectedProcedure
    .input(GetPgsqlTableTriggersSchema)
    .query(async ({ ctx, input }) => {
      const { pool, schemaName, tableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const { rows } = await pool.query<Record<string, unknown>>(
        `
          SELECT
            tg.tgname AS name,
            CASE
              WHEN (tg.tgtype & 2) <> 0 THEN 'BEFORE'
              WHEN (tg.tgtype & 64) <> 0 THEN 'INSTEAD OF'
              ELSE 'AFTER'
            END AS timing,
            CONCAT_WS(
              ', ',
              CASE WHEN (tg.tgtype & 4) <> 0 THEN 'INSERT' END,
              CASE WHEN (tg.tgtype & 16) <> 0 THEN 'UPDATE' END,
              CASE WHEN (tg.tgtype & 8) <> 0 THEN 'DELETE' END,
              CASE WHEN (tg.tgtype & 32) <> 0 THEN 'TRUNCATE' END
            ) AS event,
            CASE tg.tgenabled
              WHEN 'O' THEN 'ENABLED'
              WHEN 'D' THEN 'DISABLED'
              WHEN 'R' THEN 'REPLICA'
              WHEN 'A' THEN 'ALWAYS'
              ELSE tg.tgenabled::text
            END AS status,
            pg_get_triggerdef(tg.oid, TRUE) AS definition
          FROM pg_trigger tg
          JOIN pg_class tbl ON tbl.oid = tg.tgrelid
          JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
          WHERE ns.nspname = $1
            AND tbl.relname = $2
            AND NOT tg.tgisinternal
          ORDER BY tg.tgname
        `,
        [schemaName, tableName],
      );

      return rows.map((item: Record<string, unknown>) => normalizePgsqlRow(item));
    }),

  createTableTrigger: protectedProcedure
    .input(CreatePgsqlTableTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool } = await getPgsqlTableContext(ctx.pool.getPgsqlInstance, input);
      await pool.query(normalizeRequiredDefinition(input.definition, 'definition'));
      return null;
    }),

  updateTableTrigger: protectedProcedure
    .input(UpdatePgsqlTableTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const oldName = quotePgsqlIdentifier(input.oldName, 'trigger');

      await withPgsqlTransaction(pool, async client => {
        await client.query(`DROP TRIGGER IF EXISTS ${oldName} ON ${qualifiedTableName}`);
        await client.query(normalizeRequiredDefinition(input.definition, 'definition'));
      });

      return null;
    }),

  deleteTableTrigger: protectedProcedure
    .input(DeletePgsqlTableTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const name = quotePgsqlIdentifier(input.name, 'trigger');
      await pool.query(`DROP TRIGGER IF EXISTS ${name} ON ${qualifiedTableName}`);
      return null;
    }),

  getTablePartitions: protectedProcedure
    .input(GetPgsqlTablePartitionsSchema)
    .query(async ({ ctx, input }) => {
      const { pool, schemaName, tableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const serverVersionNum = await getPgsqlServerVersionNum(pool);
      if (serverVersionNum < 100000) {
        return [];
      }
      const { rows } = await pool.query<Record<string, unknown>>(
        `
          SELECT
            child_ns.nspname || '.' || child.relname AS name,
            ppt.partstrat AS strategy,
            pg_get_partkeydef(ppt.partrelid) AS partitionKey,
            pg_get_expr(child.relpartbound, child.oid, TRUE) AS bound,
            pg_total_relation_size(child.oid)::bigint AS totalSize,
            COALESCE(stat.n_live_tup, 0)::bigint AS liveRows
          FROM pg_partitioned_table ppt
          JOIN pg_class parent ON parent.oid = ppt.partrelid
          JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
          JOIN pg_inherits inh ON inh.inhparent = parent.oid
          JOIN pg_class child ON child.oid = inh.inhrelid
          JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
          LEFT JOIN pg_stat_all_tables stat ON stat.relid = child.oid
          WHERE parent_ns.nspname = $1
            AND parent.relname = $2
          ORDER BY child.relname
        `,
        [schemaName, tableName],
      );

      return rows.map((item: Record<string, unknown>) => {
        const normalized = normalizePgsqlRow(item) as Record<string, unknown>;
        return {
          ...normalized,
          strategy: mapPartitionStrategy(String(normalized.strategy || '')),
        };
      });
    }),

  createTablePartition: protectedProcedure
    .input(CreatePgsqlTablePartitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, schemaName, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const serverVersionNum = await getPgsqlServerVersionNum(pool);
      if (serverVersionNum < 100000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Declarative partition management requires PostgreSQL 10+.',
        });
      }
      const parsedPartitionName = parseObjectWithDefaultSchema(input.partitionName, schemaName);
      const definition = normalizeRequiredDefinition(input.definition, 'definition').replace(
        /;\s*$/,
        '',
      );

      await pool.query(
        `CREATE TABLE ${parsedPartitionName.quotedSchemaName}.${parsedPartitionName.quotedTableName} PARTITION OF ${qualifiedTableName} ${definition}`,
      );

      return null;
    }),

  updateTablePartition: protectedProcedure
    .input(UpdatePgsqlTablePartitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, schemaName, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const serverVersionNum = await getPgsqlServerVersionNum(pool);
      if (serverVersionNum < 100000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Declarative partition management requires PostgreSQL 10+.',
        });
      }
      const oldPartition = parseObjectWithDefaultSchema(input.oldName, schemaName);
      const nextPartition = parseObjectWithDefaultSchema(input.partitionName, schemaName);
      const definition = normalizeRequiredDefinition(input.definition, 'definition').replace(
        /;\s*$/,
        '',
      );

      await withPgsqlTransaction(pool, async client => {
        let currentSchemaName = oldPartition.schemaName;
        let currentTableName = oldPartition.tableName;

        await client.query(
          `ALTER TABLE ${qualifiedTableName} DETACH PARTITION ${oldPartition.quotedSchemaName}.${oldPartition.quotedTableName}`,
        );

        if (oldPartition.schemaName !== nextPartition.schemaName) {
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${nextPartition.quotedSchemaName}`);
          await client.query(
            `ALTER TABLE ${quotePgsqlIdentifier(currentSchemaName, 'schema')}.${quotePgsqlIdentifier(currentTableName, 'partition')} SET SCHEMA ${nextPartition.quotedSchemaName}`,
          );
          currentSchemaName = nextPartition.schemaName;
        }

        if (currentTableName !== nextPartition.tableName) {
          await client.query(
            `ALTER TABLE ${quotePgsqlIdentifier(currentSchemaName, 'schema')}.${quotePgsqlIdentifier(currentTableName, 'partition')} RENAME TO ${nextPartition.quotedTableName}`,
          );
          currentTableName = nextPartition.tableName;
        }

        await client.query(
          `ALTER TABLE ${qualifiedTableName} ATTACH PARTITION ${quotePgsqlIdentifier(currentSchemaName, 'schema')}.${quotePgsqlIdentifier(currentTableName, 'partition')} ${definition}`,
        );
      });

      return null;
    }),

  deleteTablePartition: protectedProcedure
    .input(DeletePgsqlTablePartitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, schemaName } = await getPgsqlTableContext(ctx.pool.getPgsqlInstance, input);
      const serverVersionNum = await getPgsqlServerVersionNum(pool);
      if (serverVersionNum < 100000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Declarative partition management requires PostgreSQL 10+.',
        });
      }
      const parsedPartitionName = parseObjectWithDefaultSchema(input.name, schemaName);
      await pool.query(
        `DROP TABLE IF EXISTS ${parsedPartitionName.quotedSchemaName}.${parsedPartitionName.quotedTableName}`,
      );
      return null;
    }),

  createTableIndex: protectedProcedure
    .input(CreatePgsqlTableIndexSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const trimmedIndexName = input.indexName.trim();
      if (!trimmedIndexName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'indexName cannot be empty.',
        });
      }
      const indexName = quotePgsqlIdentifier(trimmedIndexName, 'index');
      const normalizedColumns = Array.from(
        new Set(input.columns.map(column => column.trim())),
      ).filter(column => !!column);
      if (!normalizedColumns.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'columns cannot be empty.',
        });
      }
      const columns = normalizedColumns
        .map(column => quotePgsqlIdentifier(column, 'column'))
        .join(', ');
      const method = (input.method || 'btree').trim().toLowerCase();

      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(method)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid index method: ${method}`,
        });
      }

      const sql = `CREATE ${input.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${qualifiedTableName} USING ${method} (${columns})`;
      await pool.query(sql);
      return null;
    }),

  dropTableIndex: protectedProcedure
    .input(DropPgsqlTableIndexSchema)
    .mutation(async ({ ctx, input }) => {
      const { pool, quotedSchemaName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );
      const parts = input.indexName.split('.');
      const quotedIndexName =
        parts.length === 2
          ? `${quotePgsqlIdentifier(parts[0], 'schema')}.${quotePgsqlIdentifier(parts[1], 'index')}`
          : `${quotedSchemaName}.${quotePgsqlIdentifier(input.indexName, 'index')}`;

      await pool.query(`DROP INDEX ${quotedIndexName}`);
      return null;
    }),

  getTableDDL: protectedProcedure.input(GetPgsqlTableDDLSchema).query(async ({ ctx, input }) => {
    const { pool, schemaName, tableName, quotedSchemaName, quotedTableName } =
      await getPgsqlTableContext(ctx.pool.getPgsqlInstance, input);
    const serverVersionNum = await getPgsqlServerVersionNum(pool);

    const [columns, constraintsResult, indexesResult] = await Promise.all([
      getPgsqlColumns(pool, schemaName, tableName, serverVersionNum),
      pool.query<{
        name: string;
        definition: string;
      }>(
        `
          SELECT
            c.conname AS name,
            pg_get_constraintdef(c.oid, TRUE) AS definition
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = $1
            AND t.relname = $2
          ORDER BY c.contype DESC, c.conname
        `,
        [schemaName, tableName],
      ),
      pool.query<{
        indexname: string;
        indexdef: string;
      }>(
        `
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = $1
            AND tablename = $2
          ORDER BY indexname
        `,
        [schemaName, tableName],
      ),
    ]);

    const columnDefinitions = columns.map((column: IPgsqlColumn) => {
      const pieces = [
        `  ${quotePgsqlIdentifier(column.name, 'column')} ${column.dataType}`,
        column.isIdentity
          ? `GENERATED ${column.identityGeneration || 'BY DEFAULT'} AS IDENTITY`
          : '',
        column.nullable ? '' : 'NOT NULL',
        !column.isIdentity && column.defaultValue ? `DEFAULT ${column.defaultValue}` : '',
      ].filter(Boolean);

      return pieces.join(' ');
    });
    const constraintDefinitions = constraintsResult.rows.map(
      (constraint: { name: string; definition: string }) =>
        `  CONSTRAINT ${quotePgsqlIdentifier(constraint.name, 'constraint')} ${constraint.definition}`,
    );

    const createTableSQL = [
      `CREATE TABLE ${quotedSchemaName}.${quotedTableName} (`,
      [...columnDefinitions, ...constraintDefinitions].join(',\n'),
      ');',
    ].join('\n');
    const columnCommentSQL = columns
      .filter((column: IPgsqlColumn) => !!column.comment?.trim())
      .map((column: IPgsqlColumn) => {
        const escapedComment = String(column.comment).replace(/'/g, "''");
        return `COMMENT ON COLUMN ${quotedSchemaName}.${quotedTableName}.${quotePgsqlIdentifier(column.name, 'column')} IS '${escapedComment}';`;
      })
      .join('\n');
    const indexSQL = indexesResult.rows
      .map((index: { indexname: string; indexdef: string }) => `${index.indexdef};`)
      .join('\n');
    const ddlParts = [createTableSQL];

    if (columnCommentSQL) {
      ddlParts.push(`-- Column comments\n${columnCommentSQL}`);
    }
    if (indexSQL) {
      ddlParts.push(`-- Indexes\n${indexSQL}`);
    }

    return {
      ddl: ddlParts.join('\n\n'),
    };
  }),

  getTableStats: protectedProcedure
    .input(GetPgsqlTableStatsSchema)
    .query(async ({ ctx, input }) => {
      const { pool, schemaName, tableName, qualifiedTableName } = await getPgsqlTableContext(
        ctx.pool.getPgsqlInstance,
        input,
      );

      const [statsResult, countResult] = await Promise.all([
        pool.query<Record<string, unknown>>(
          `
            SELECT
              c.reltuples::bigint AS "estimatedRows",
              pg_relation_size(c.oid)::bigint AS "tableSize",
              pg_indexes_size(c.oid)::bigint AS "indexesSize",
              pg_total_relation_size(c.oid)::bigint AS "totalSize",
              s.n_live_tup::bigint AS "liveTuples",
              s.n_dead_tup::bigint AS "deadTuples",
              s.n_tup_ins::bigint AS "insertedTuples",
              s.n_tup_upd::bigint AS "updatedTuples",
              s.n_tup_del::bigint AS "deletedTuples",
              s.last_vacuum AS "lastVacuum",
              s.last_autovacuum AS "lastAutovacuum",
              s.last_analyze AS "lastAnalyze",
              s.last_autoanalyze AS "lastAutoanalyze"
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
            WHERE n.nspname = $1
              AND c.relname = $2
              AND c.relkind = 'r'
            LIMIT 1
          `,
          [schemaName, tableName],
        ),
        pool.query<{ count: string }>(
          `SELECT COUNT(*)::bigint AS count FROM ${qualifiedTableName}`,
        ),
      ]);

      if (!statsResult.rows[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'The selected table was not found.',
        });
      }

      return {
        ...normalizePgsqlRow(statsResult.rows[0]),
        exactRows: Number(countResult.rows[0]?.count || 0),
      };
    }),
});

export default pgsqlRouter;
