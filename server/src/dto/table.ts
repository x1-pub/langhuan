import { isInt, isLength } from 'validator'
import { Rule, Validator } from '@/utils/validator'

interface TableSearchParams {
  connectionId: string;
  dbName: string;
}
export class TableSearchDTO extends Validator<TableSearchParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
    ]
  }
}

interface CreateOrDeleteTableParams extends TableSearchParams {
  tableName: string;
  comment?: string;
}
export class CreateOrDeleteTableDTO extends Validator<CreateOrDeleteTableParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
    ]
  }
}

interface RenameTableParams extends CreateOrDeleteTableParams {
  newTableName: string;
}
export class RenameTableDTO extends Validator<RenameTableParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
      new Rule(isLength, 'tableName', { min: 1 }),
      new Rule(isLength, 'newTableName', { min: 1 }),
    ]
  }
}
