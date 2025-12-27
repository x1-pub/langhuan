import { z } from 'zod';

import {
  EMySQLFieldDefaultType,
  EMySQLDataExportType,
  EMySQLIndexType,
  EMySQLOrder,
  EMySQLTriggerEvent,
  EMySQLTriggerTiming,
  EMySQLEventStatus,
  EMySQLViewCheckOption,
  EMysqlFunctionDataAccess,
  EMysqlFunctionSecurity,
} from '../types/mysql';

export const MySQLProcessedDataSchema = z.union([
  z.null(),
  z.string(),
  z.number(),
  z.object({
    type: z.literal('json'),
    value: z.string(),
  }),
  z.object({
    type: z.literal('buffer'),
    value: z.array(z.number()),
  }),
  z.object({
    type: z.literal('spatial'),
    value: z.string(),
  }),
]);

const ConditionItemSchema = z.record(z.string(), MySQLProcessedDataSchema);

export const MysqlBaseColumnInfoSchema = z.object({
  fieldName: z.string(),
  fieldType: z.string(),
  allowNull: z.boolean().optional(),
  defaultValue: z.string().optional(),
  defaultValueType: z.enum(Object.values(EMySQLFieldDefaultType)).optional(),
  onUpdateCurrentTime: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  autoIncrement: z.boolean().optional(),
  unsigned: z.boolean().optional(),
  zerofill: z.boolean().optional(),
  charset: z.string().optional(),
  collation: z.string().optional(),
  comment: z.string().optional(),
});

export const MySQLBaseTrigger = z.object({
  name: z.string(),
  statement: z.string(),
  event: z.enum(Object.values(EMySQLTriggerEvent)),
  timing: z.enum(Object.values(EMySQLTriggerTiming)),
});

export const MySQLBaseSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
  tableName: z.string(),
});

export const GeTMySQLProcessedDatasSchema = MySQLBaseSchema.extend({
  current: z.int(),
  pageSize: z.int(),
  whereClause: z.string(),
});

export const BatchDeleteDataSchema = MySQLBaseSchema.extend({
  condition: z.array(ConditionItemSchema),
});

export const BatchUpdateDataSchema = MySQLBaseSchema.extend({
  data: ConditionItemSchema,
  condition: z.array(ConditionItemSchema),
});

export const BatchInsertDataSchema = MySQLBaseSchema.extend({
  data: ConditionItemSchema,
});

export const ExportDataSchema = MySQLBaseSchema.extend({
  condition: z.array(ConditionItemSchema),
  fields: z.array(z.string()),
  type: z.enum(Object.values(EMySQLDataExportType)),
});

export const AddTableIndexSchema = MySQLBaseSchema.extend({
  name: z.string().optional(),
  comment: z.string().optional(),
  type: z.enum(Object.values(EMySQLIndexType)),
  fields: z.array(
    z.object({
      name: z.string(),
      len: z.number().optional(),
      order: z.enum(Object.values(EMySQLOrder)).optional(),
    }),
  ),
});

export const DeleteTableIndexSchema = MySQLBaseSchema.extend({
  name: z.string(),
});

export const UpdateTableIndexSchema = AddTableIndexSchema.extend({
  oldName: z.string(),
});

export const SortMysqlColumnSchema = MySQLBaseSchema.extend({
  fields: z.array(z.string()),
});

export const DeleteColumnSchema = MySQLBaseSchema.extend({
  name: z.string(),
});

export const AddColumnSchema = MySQLBaseSchema.extend(MysqlBaseColumnInfoSchema.shape);

export const UpdateColumnSchema = AddColumnSchema.extend({
  oldFieldName: z.string(),
});

export const AddTriggerSchema = MySQLBaseSchema.extend(MySQLBaseTrigger.shape);

export const DeleteTriggerSchema = MySQLBaseSchema.extend({
  name: z.string(),
});

export const UpdateTriggerSchema = AddTriggerSchema.extend({
  oldName: z.string(),
});

export const GetFunctionsSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
});

export const DeleteFunctionSchema = GetFunctionsSchema.extend({
  name: z.string(),
});

export const BaseFunctionSchema = DeleteFunctionSchema.extend({
  params: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
  returns: z.string(),
  deterministic: z.boolean().optional(),
  sqlDataAccess: z.enum(Object.values(EMysqlFunctionDataAccess)).optional(),
  body: z.string(),
  comment: z.string().optional(),
  security: z.enum(Object.values(EMysqlFunctionSecurity)).optional(),
});

export const UpdateFunctionSchema = BaseFunctionSchema.extend({
  oldName: z.string(),
});

export const GetEventsSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
});

export const DeleteEventSchema = GetEventsSchema.extend({
  name: z.string(),
});

export const BaseEventSchema = DeleteEventSchema.extend({
  schedule: z.string(),
  status: z.enum(Object.values(EMySQLEventStatus)).optional(),
  definer: z.string().optional(),
  definition: z.string(),
  comment: z.string().optional(),
});

export const UpdateEventSchema = BaseEventSchema.extend({
  oldName: z.string(),
});

export const GetViewsSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
});

export const DeleteViewSchema = GetViewsSchema.extend({
  name: z.string(),
});

export const BaseViewSchema = DeleteViewSchema.extend({
  definer: z.string().optional(),
  checkOption: z.enum(Object.values(EMySQLViewCheckOption)).optional(),
  security: z.enum(Object.values(EMysqlFunctionSecurity)).optional(),
  algorithm: z.string().optional(),
  definition: z.string(),
  comment: z.string().optional(),
});

export const UpdateViewSchema = BaseViewSchema.extend({
  oldName: z.string(),
});
