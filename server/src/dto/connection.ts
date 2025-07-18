import { isLength, isPort, isInt } from 'validator'
import { Rule, Validator, isIncludes } from '@/utils/validator'
import { ConnectionType } from '@/model/connection';

interface ConnectionCreateParams {
  type: ConnectionType;
  name: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  database?: string;
}
export class ConnectionCreateDTO extends Validator<ConnectionCreateParams> {
  useRules() {
    return [
      new Rule(isIncludes, 'type', [...Object.values(ConnectionType)]),
      new Rule(isLength, 'name', { min: 1 }),
      new Rule(isLength, 'host', { min: 1 }),
      new Rule(isPort, 'port'),
    ]
  }
}

export class ConnectionDetailsDTO extends Validator<{ connectionId: string }> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
    ]
  }
}

interface ModifyConnectionParams extends Omit<ConnectionCreateParams, 'password'> {
  id: number | string;
}
export class ModifyConnectionDTO extends Validator<ModifyConnectionParams> {
  useRules() {
    return [
      new Rule(isInt, 'id'),
      new Rule(isIncludes, 'type', [...Object.values(ConnectionType)]),
      new Rule(isLength, 'name', { min: 1 }),
      new Rule(isLength, 'host', { min: 1 }),
      new Rule(isPort, 'port'),
    ]
  }
}

export class DeleteConnectionDTO extends Validator<{ id: number }> {
  useRules() {
    return [
      new Rule(isInt, 'id'),
    ]
  }
}

interface TestConnectionParams extends ConnectionCreateParams {
  id?: number | string;
}
export class TestConnectionDTO extends Validator<TestConnectionParams> {
  useRules() {
    return [
      new Rule(isInt, 'id').allowNull(),
      new Rule(isIncludes, 'type', [...Object.values(ConnectionType)]),
      new Rule(isLength, 'name', { min: 1 }),
      new Rule(isLength, 'host', { min: 1 }),
      new Rule(isPort, 'port'),
    ]
  }
}
