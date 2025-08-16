import { isInt, isLength } from 'validator'
import { Rule, Validator } from '@/utils/validator'

interface ExecuteMongoDBCommand {
  connectionId: number;
  command: string;
}

export class ExecuteMongoDBCommandDTO extends Validator<ExecuteMongoDBCommand> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'command', { min: 1 }),
    ]
  }
}