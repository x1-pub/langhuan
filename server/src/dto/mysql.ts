import { isInt, matches, isLength } from 'validator'
import { Rule, Validator, isIncludes } from '@/utils/validator'
import { ParameterError } from '@/utils/error';

export interface MySQLBaseParams {
  connectionId: string;
  dbName: string;
  tableName: string;
}

export class MySQLBaseDTO extends Validator<MySQLBaseParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }
}
interface MySQLSearchParams extends MySQLBaseParams {
  current: number;
  pageSize: number;
  condition: string;
}

export class MySQLSearchDTO extends Validator<MySQLSearchParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isInt, 'current', { min: 1 }),
      new Rule(isInt, 'pageSize', { min: 1 }),
      new Rule(matches, 'condition', '^where\\s', 'i'),
    ]
  }
}

interface MySQLUpdateParams extends MySQLBaseParams {
  data: Record<string, any>
  condition: Record<string, any>[];
}

export class MySQLUpdateDTO extends Validator<MySQLUpdateParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }

  useValidate(form: MySQLUpdateParams) {
    const { condition, data } = form

    if (Object.prototype.toString.call(data) !== '[object Object]') {
      throw new ParameterError('data类型错误')
    }

    if (!Object.keys(data).length) {
      throw new ParameterError('无更新内容')
    }

    if (!Array.isArray(condition) || !condition.length) {
      throw new ParameterError('condition类型错误')
    }

    condition.forEach(con => {
      if (Object.prototype.toString.call(con) !== '[object Object]' || !Object.keys(con).length) {
        throw new ParameterError('condition类型错误')
      }
    })
  }
}

interface MySQLInsertOneParams extends MySQLBaseParams {
  data: Record<string, any>
}

export class MySQLInsertOneDTO extends Validator<MySQLInsertOneParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }

  useValidate(form: Record<string, any>) {
    if (Object.prototype.toString.call(form.data) !== '[object Object]') {
      throw new ParameterError('data类型错误')
    }

    if (!Object.keys(form.data).length) {
      throw new ParameterError('data为空')
    }
  }
}

interface MySQLBatchDeleteParams extends MySQLBaseParams {
  condition: Record<string, any>[];
}

export class MySQLBatchDeleteDTO extends Validator<MySQLBatchDeleteParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }

  useValidate(form: MySQLBatchDeleteParams) {
    const { condition } = form

    if (!Array.isArray(condition) || !condition.length) {
      throw new ParameterError('condition类型错误')
    }

    condition.forEach(con => {
      if (Object.prototype.toString.call(con) !== '[object Object]' || !Object.keys(con).length) {
        throw new ParameterError('condition类型错误')
      }
    })
  }
}

interface MySQLAddIndexParams extends MySQLBaseParams {
  name?: string;
  data: {
    type: string;
    field: {
      name: string;
      len?: number | null;
      order?: 'ASC' | 'DESC';
    }[];
    name?: string;
    comment?: string;
  }
}

export class MySQLAddIndexDTO extends Validator<MySQLAddIndexParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }

  useValidate(form: MySQLAddIndexParams) {
    const { type, field } = form.data || {}
    if (!type || !field) {
      throw new ParameterError('data.type data.field 空错误')
    }
    if (!Array.isArray(field) || !field?.length) {
      throw new ParameterError('data.field 错误')
    }
    field.forEach(f => {
      if (!f.name) {
        throw new ParameterError('data.field.name 错误')
      }
    })
  }
}

export class MySQLdeleteIndexDTO extends Validator<{ name: string } & MySQLBaseParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isLength, 'name', { min: 1 }),
    ]
  }
}

export class MySQLupdateIndexDTO extends Validator<Required<MySQLAddIndexParams>> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isLength, 'name', { min: 1 }),
    ]
  }

  useValidate(form: MySQLAddIndexParams) {
    const { type, field } = form.data || {}
    if (!type || !field) {
      throw new ParameterError('data.type data.field 空错误')
    }
    if (!Array.isArray(field) || !field?.length) {
      throw new ParameterError('data.field 错误')
    }
    field.forEach(f => {
      if (!f.name) {
        throw new ParameterError('data.field.name 错误')
      }
    })
  }
}

interface CloumnConfig {
  oldFieldName?: string;
  fieldName: string;
  fieldType: string;
  fieldExtra?: string;
  allowNull?: boolean;
  defaultValue?: string;
  defaultValueType?: 'NONE' | 'NULL' | 'EMPTY_STRING' | 'CUSTOM';
  onUpdateCurrentTime?: string;
  isPrimary?: boolean;
  autoIncrement?: boolean;
  unsigned?: boolean;
  zerofill?: boolean;
  charset?: string;
  collation?: string;
  comment?: string;
}

type AddCloumnParams = { data: CloumnConfig } & MySQLBaseParams

export class MySQLAddCloumnDTO extends Validator<AddCloumnParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isLength, 'oldFieldName', { min: 1 }).allowNull(),
    ]
  }

  useValidate(form: AddCloumnParams) {
    // const { fieldName, fieldType, length, allowNull, defaultValue, isPrimary, autoIncrement, unsigned, zerofill, charset, collation, comment } = form.data || {}
    const { fieldName, fieldType, defaultValue, defaultValueType = '' } = form.data || {}

    if (!isLength(fieldName, { min: 1 })) {
      throw new ParameterError('fieldName Error')
    }

    if (!isLength(fieldType, { min: 1 })) {
      throw new ParameterError('fieldType Error')
    }

    if (defaultValue && !['NONE', 'NULL', 'EMPTY_STRING', 'CUSTOM'].includes(defaultValueType)) {
      throw new ParameterError('defaultValueType Error')
    }
  }
}

export class MySQLDeleteColumnDTO extends Validator<{ name: string } & MySQLBaseParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isLength, 'name', { min: 1 }),
    ]
  }
}

export class ExecuteSQLDTO extends Validator<{ connectionId: string, dbName?: string, sql: string }> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'sql', { min: 1 }),
    ]
  }
}

export enum Format {
  SQL = 'sql',
  EXCEL = 'excel',
  JSON = 'json',
}

interface ExportParams extends MySQLBaseParams {
  condition: Record<string, any>[];
  fields: string[];
  type: Format;
}
export class ExportDTO extends Validator<ExportParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isIncludes, 'type', [...Object.values(Format)]),
    ]
  }

  useValidate(form: ExportParams) {
    const { condition, fields } = form

    if (!Array.isArray(condition) || !condition.length) {
      throw new ParameterError('condition类型错误1')
    }

    condition.forEach(con => {
      if (Object.prototype.toString.call(con) !== '[object Object]' || !Object.keys(con).length) {
        throw new ParameterError('condition类型错误2')
      }
    })

    if (!Array.isArray(fields)) {
      throw new ParameterError('fields类型错误1')
    }
  }
}
