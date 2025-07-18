import { isInt, isLength } from 'validator'
import { Rule, Validator } from '@/utils/validator'

interface DatabaseSearchParams {
  connectionId: string;
}
export class DatabaseSearchDTO extends Validator<DatabaseSearchParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
    ]
  }
}

interface CreateOrDeleteDatabaseParams extends DatabaseSearchParams {
  dbName: string;
  charset?: string;
  collation?: string;
}
export class CreateOrDeleteDatabaseDTO extends Validator<CreateOrDeleteDatabaseParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'dbName', { min: 1 }),
    ]
  }
}
