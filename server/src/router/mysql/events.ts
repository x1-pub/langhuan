import { QueryTypes, Sequelize } from 'sequelize';

import {
  BaseEventSchema,
  DeleteEventSchema,
  GetEventsSchema,
  UpdateEventSchema,
} from '@packages/zod/mysql';
import { EMySQLEventStatus } from '@packages/types/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';

interface IOriginEvent {
  name: string;
  status: EMySQLEventStatus;
  definer: string;
  definition: string;
  comment: string;
  eventType: 'ONE TIME' | 'RECURRING';
  intervalValue: string | number | null;
  intervalField: string | null;
  executeAt: Date | string | null;
  starts: Date | string | null;
  ends: Date | string | null;
}

const formatDateTime = (value: Date | string | null) => {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().replace('T', ' ').split('.')[0];
  }
  return `${value}`.replace('T', ' ').split('.')[0];
};

const buildSchedule = (event: IOriginEvent) => {
  if (event.eventType === 'ONE TIME') {
    return event.executeAt ? `AT ${formatDateTime(event.executeAt)}` : '';
  }

  const parts = [`EVERY ${event.intervalValue} ${event.intervalField}`];
  if (event.starts) {
    parts.push(`STARTS ${formatDateTime(event.starts)}`);
  }
  if (event.ends) {
    parts.push(`ENDS ${formatDateTime(event.ends)}`);
  }

  return parts.join(' ');
};

const buildDefinerSQL = (definer: string | undefined, instance: Sequelize) => {
  if (!definer) return '';

  const [user, host] = definer.split('@');
  if (host) {
    const escapedUser = instance.escape(user);
    const escapedHost = instance.escape(host);
    return `DEFINER = ${escapedUser}@${escapedHost}`;
  }

  return `DEFINER = ${definer}`;
};

const mysqlEventsRouter = router({
  getEvents: protectedProcedure.input(GetEventsSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const events: IOriginEvent[] = await instance.query(
      `
      SELECT
        EVENT_NAME AS name,
        STATUS AS status,
        DEFINER AS definer,
        EVENT_DEFINITION AS definition,
        EVENT_COMMENT AS comment,
        EVENT_TYPE AS eventType,
        INTERVAL_VALUE AS intervalValue,
        INTERVAL_FIELD AS intervalField,
        EXECUTE_AT AS executeAt,
        STARTS AS starts,
        ENDS AS ends
      FROM information_schema.EVENTS
      WHERE EVENT_SCHEMA = ?
      ORDER BY EVENT_NAME;
    `,
      {
        replacements: [dbName],
        type: QueryTypes.SELECT,
      },
    );

    return events.map(ev => ({
      connectionId,
      dbName,
      name: ev.name,
      status: ev.status,
      definer: ev.definer,
      definition: ev.definition,
      comment: ev.comment,
      schedule: buildSchedule(ev),
    }));
  }),

  createEvent: protectedProcedure.input(BaseEventSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name, schedule, status, definer, definition, comment } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const eventName = escapedMySQLName(name, instance);
    const statusSQL = status === EMySQLEventStatus.DISABLED ? 'DISABLE' : 'ENABLE';
    const commentSQL = comment ? `COMMENT ${instance.escape(comment)}` : '';
    const definerSQL = buildDefinerSQL(definer, instance);
    const trimmedBody = definition.trim();

    const createSQL = `CREATE ${definerSQL ? `${definerSQL} ` : ''}EVENT ${eventName} ON SCHEDULE ${schedule} ${statusSQL} ${commentSQL} DO ${trimmedBody}`;

    await instance.query(createSQL);
    return null;
  }),

  updateEvent: protectedProcedure.input(UpdateEventSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name, oldName, schedule, status, definer, definition, comment } =
      input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const eventName = escapedMySQLName(name, instance);
    const dropName = escapedMySQLName(oldName || name, instance);
    const statusSQL = status === EMySQLEventStatus.DISABLED ? 'DISABLE' : 'ENABLE';
    const commentSQL = comment ? `COMMENT ${instance.escape(comment)}` : '';
    const definerSQL = buildDefinerSQL(definer, instance);
    const trimmedBody = definition.trim();

    const createSQL = `CREATE ${definerSQL ? `${definerSQL} ` : ''}EVENT ${eventName} ON SCHEDULE ${schedule} ${statusSQL} ${commentSQL} DO ${trimmedBody}`;

    const transaction = await instance.transaction();
    try {
      await instance.query(`DROP EVENT IF EXISTS ${dropName};`, { transaction });
      await instance.query(createSQL, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return null;
  }),

  deleteEvent: protectedProcedure.input(DeleteEventSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedName = escapedMySQLName(name, instance);
    await instance.query(`DROP EVENT IF EXISTS ${escapedName};`);

    return null;
  }),
});

export default mysqlEventsRouter;
