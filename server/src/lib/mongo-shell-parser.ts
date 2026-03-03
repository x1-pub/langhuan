/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose from 'mongoose';

import { normalizeMongoValue, reviveMongoSpecialTypes } from './mongodb';

interface ParsedCommand {
  collection: string;
  operation: string;
  args: any[];
  chainedOperations?: ChainedOperation[];
}

interface ChainedOperation {
  method: string;
  args: any[];
}

interface ParseStateFrame {
  type: 'object' | 'array';
  expectingKey: boolean;
}

export interface MongoShellExecutionResult {
  result: unknown;
  changeDatabase?: string;
}

export class MongoShellParser {
  private connection: mongoose.Connection;
  private modelNameMap = new Map<string, string>();

  constructor(connection: mongoose.Connection) {
    this.connection = connection;
  }

  /**
   * Execute a MongoDB shell command
   */
  async executeCommand(command: string): Promise<MongoShellExecutionResult> {
    const cleanCommand = this.cleanCommand(command);
    const parsed = this.parseCommand(cleanCommand);

    return this.executeOperation(parsed);
  }

  /**
   * Clean and normalize the command string
   */
  private cleanCommand(command: string): string {
    return command.trim().replace(/;\s*$/, '');
  }

  /**
   * Parse MongoDB shell command into structured format
   */
  private parseCommand(command: string): ParsedCommand {
    if (/^use\s+.+/i.test(command)) {
      const dbNameRaw = command.replace(/^use\s+/i, '').trim();
      return this.parseUseCommand(dbNameRaw);
    }

    if (/^show\s+/i.test(command)) {
      return this.parseShowCommand(command);
    }

    const getCollectionMatch = command.match(/^db\.getCollection\((.+)\)\.(.+)$/i);
    if (getCollectionMatch) {
      const [, rawCollection, operationsString] = getCollectionMatch;
      const collection = this.parseCollectionName(rawCollection);
      return this.parseChainedOperations(collection, operationsString);
    }

    const bracketCollectionMatch = command.match(/^db\[['"](.+?)['"]\]\.(.+)$/);
    if (bracketCollectionMatch) {
      const [, collection, operationsString] = bracketCollectionMatch;
      return this.parseChainedOperations(collection, operationsString);
    }

    const collectionMatch = command.match(/^db\.([a-zA-Z_$][a-zA-Z0-9_$]*)\.(.+)$/);
    if (collectionMatch) {
      const [, collection, operationsString] = collectionMatch;
      return this.parseChainedOperations(collection, operationsString);
    }

    const dbMatch = command.match(/^db\.(\w+)\((.*)\)$/);
    if (dbMatch) {
      const [, operation, argsString] = dbMatch;
      return {
        collection: '',
        operation,
        args: this.parseArguments(argsString),
      };
    }

    throw new Error(`Unsupported command format: ${command}`);
  }

  /**
   * Parse use commands
   */
  private parseUseCommand(dbNameRaw: string): ParsedCommand {
    const dbName = this.parseCollectionName(dbNameRaw);

    return {
      collection: '',
      operation: 'use',
      args: [dbName],
    };
  }

  /**
   * Parse show commands
   */
  private parseShowCommand(command: string): ParsedCommand {
    const showType = command
      .replace(/^show\s+/i, '')
      .trim()
      .toLowerCase();

    return {
      collection: '',
      operation: 'show',
      args: [showType],
    };
  }

  /**
   * Parse chained operations like find().limit(10).sort({name: 1})
   */
  private parseChainedOperations(collection: string, operationsString: string): ParsedCommand {
    const methods = this.splitChainedMethods(operationsString);

    if (methods.length === 0) {
      throw new Error(`No operations found in: ${operationsString}`);
    }

    const firstMethod = methods[0];
    const mainOperation = this.parseMethodCall(firstMethod);
    const chainedOperations: ChainedOperation[] = methods
      .slice(1)
      .map(method => this.parseMethodCall(method));

    return {
      collection,
      operation: mainOperation.method,
      args: mainOperation.args,
      chainedOperations: chainedOperations.length > 0 ? chainedOperations : undefined,
    };
  }

  /**
   * Split chained method calls like "find({}).limit(10).sort({name: 1})"
   */
  private splitChainedMethods(operationsString: string): string[] {
    const methods: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < operationsString.length; i++) {
      const char = operationsString[i];

      if (inString) {
        current += char;

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          continue;
        }

        if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '(') {
        depth++;
        current += char;
        continue;
      }

      if (char === ')') {
        depth--;
        current += char;

        if (depth === 0) {
          methods.push(current.trim());
          current = '';
          if (i + 1 < operationsString.length && operationsString[i + 1] === '.') {
            i++;
          }
        }
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      methods.push(current.trim());
    }

    return methods;
  }

  /**
   * Parse a single method call like "find({name: 'John'})"
   */
  private parseMethodCall(methodString: string): ChainedOperation {
    const match = methodString.match(/^(\w+)\((.*)\)$/);
    if (!match) {
      throw new Error(`Invalid method call format: ${methodString}`);
    }

    const [, method, argsString] = match;
    const args = this.parseArguments(argsString);

    return { method, args };
  }

  /**
   * Parse function arguments, handling JavaScript-like object syntax
   */
  private parseArguments(argsString: string): any[] {
    const cleanArgs = argsString.trim();
    if (!cleanArgs) {
      return [];
    }

    try {
      const args = this.splitArguments(cleanArgs);
      return args.map(arg => this.parseValue(arg));
    } catch (error) {
      throw new Error(`Failed to parse arguments: ${cleanArgs}. Error: ${error}`);
    }
  }

  private parseCollectionName(raw: string): string {
    const parsed = this.parseValue(raw.trim());

    if (typeof parsed !== 'string') {
      throw new Error(`Collection/Database name must be a string: ${raw}`);
    }

    const value = parsed.trim();
    if (!value) {
      throw new Error('Collection/Database name cannot be empty');
    }

    return value;
  }

  private parseValue(raw: string): unknown {
    const trimmed = raw.trim();

    if (!trimmed) {
      return '';
    }

    if (trimmed === 'true' || trimmed === 'false') {
      return trimmed === 'true';
    }

    if (trimmed === 'null') {
      return null;
    }

    if (trimmed === 'undefined') {
      return undefined;
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number.parseFloat(trimmed);
    }

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return this.parseQuotedString(trimmed);
    }

    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return this.parseMongoLiteral(trimmed);
    }

    return trimmed;
  }

  private parseQuotedString(input: string): string {
    const { value, endIndex } = this.readQuotedString(input, 0);
    if (endIndex !== input.length - 1) {
      throw new Error(`Invalid quoted string: ${input}`);
    }
    return value;
  }

  private parseMongoLiteral(input: string): unknown {
    const constructorNormalized = this.normalizeMongoConstructors(input);
    const normalizedJsonLike = this.normalizeJsonLikeLiteral(constructorNormalized);
    const parsed = JSON.parse(normalizedJsonLike);

    return reviveMongoSpecialTypes(parsed);
  }

  private normalizeMongoConstructors(input: string): string {
    return input
      .replace(/\bObjectId\s*\(\s*(['"])([a-fA-F0-9]{24})\1\s*\)/g, '{"$oid":"$2"}')
      .replace(/\bISODate\s*\(\s*(['"])([^'"]+)\1\s*\)/g, '{"$date":"$2"}')
      .replace(/\bnew\s+Date\s*\(\s*(['"])([^'"]+)\1\s*\)/g, '{"$date":"$2"}')
      .replace(/\bNumberLong\s*\(\s*(['"]?)(-?\d+)\1\s*\)/g, '$2')
      .replace(/\bNumberInt\s*\(\s*(['"]?)(-?\d+)\1\s*\)/g, '$2');
  }

  /**
   * Convert JavaScript-like object literals into valid JSON:
   * - Single quotes => double quotes
   * - Unquoted keys => quoted keys
   */
  private normalizeJsonLikeLiteral(input: string): string {
    const stateStack: ParseStateFrame[] = [];
    let output = '';
    let cursor = 0;

    while (cursor < input.length) {
      const char = input[cursor];
      const frame = stateStack[stateStack.length - 1];

      if (char === '"' || char === "'") {
        const { value, endIndex } = this.readQuotedString(input, cursor);
        output += JSON.stringify(value);
        cursor = endIndex + 1;
        continue;
      }

      if (frame?.type === 'object' && frame.expectingKey && this.isIdentifierStart(char)) {
        let keyEnd = cursor + 1;
        while (keyEnd < input.length && this.isIdentifierPart(input[keyEnd])) {
          keyEnd++;
        }

        let lookAhead = keyEnd;
        while (lookAhead < input.length && /\s/.test(input[lookAhead])) {
          lookAhead++;
        }

        if (input[lookAhead] === ':') {
          output += JSON.stringify(input.slice(cursor, keyEnd));
          cursor = keyEnd;
          continue;
        }
      }

      switch (char) {
        case '{':
          stateStack.push({ type: 'object', expectingKey: true });
          output += char;
          cursor++;
          continue;
        case '[':
          stateStack.push({ type: 'array', expectingKey: false });
          output += char;
          cursor++;
          continue;
        case '}':
        case ']':
          stateStack.pop();
          output += char;
          cursor++;
          continue;
        case ':':
          if (frame?.type === 'object') {
            frame.expectingKey = false;
          }
          output += char;
          cursor++;
          continue;
        case ',':
          if (frame?.type === 'object') {
            frame.expectingKey = true;
          }
          output += char;
          cursor++;
          continue;
        default:
          output += char;
          cursor++;
      }
    }

    return output;
  }

  private isIdentifierStart(char: string): boolean {
    return /[A-Za-z_$]/.test(char);
  }

  private isIdentifierPart(char: string): boolean {
    return /[A-Za-z0-9_$]/.test(char);
  }

  private readQuotedString(input: string, startIndex: number): { value: string; endIndex: number } {
    const quote = input[startIndex];
    let cursor = startIndex + 1;
    let value = '';
    let escaped = false;

    while (cursor < input.length) {
      const char = input[cursor];

      if (escaped) {
        switch (char) {
          case 'n':
            value += '\n';
            break;
          case 'r':
            value += '\r';
            break;
          case 't':
            value += '\t';
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += char;
        }
        escaped = false;
        cursor++;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        cursor++;
        continue;
      }

      if (char === quote) {
        return { value, endIndex: cursor };
      }

      value += char;
      cursor++;
    }

    throw new Error(`Unterminated string literal: ${input.slice(startIndex)}`);
  }

  /**
   * Split arguments respecting nested structures
   */
  private splitArguments(argsString: string): string[] {
    const args: string[] = [];
    let current = '';
    let objectDepth = 0;
    let arrayDepth = 0;
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (inString) {
        current += char;

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          continue;
        }

        if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '{') {
        objectDepth++;
        current += char;
        continue;
      }
      if (char === '}') {
        objectDepth--;
        current += char;
        continue;
      }
      if (char === '[') {
        arrayDepth++;
        current += char;
        continue;
      }
      if (char === ']') {
        arrayDepth--;
        current += char;
        continue;
      }
      if (char === '(') {
        parenDepth++;
        current += char;
        continue;
      }
      if (char === ')') {
        parenDepth--;
        current += char;
        continue;
      }

      if (char === ',' && objectDepth === 0 && arrayDepth === 0 && parenDepth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  /**
   * Execute the parsed operation
   */
  private async executeOperation(parsed: ParsedCommand): Promise<MongoShellExecutionResult> {
    const { collection, operation, args, chainedOperations } = parsed;

    if (operation === 'use') {
      const dbName = String(args[0] || '');
      return {
        result: `switched to db ${dbName}`,
        changeDatabase: dbName,
      };
    }

    if (operation === 'show') {
      const result = await this.executeShowCommand(args[0]);
      return { result: normalizeMongoValue(result) };
    }

    if (!collection) {
      const result = await this.executeDbOperation(operation, args);
      return { result: normalizeMongoValue(result) };
    }

    const model = this.getModel(collection);
    const result = await this.executeCollectionOperation(model, operation, args, chainedOperations);
    return { result: normalizeMongoValue(result) };
  }

  /**
   * Execute show commands
   */
  private async executeShowCommand(showType: string): Promise<any> {
    switch (showType) {
      case 'dbs':
      case 'databases':
        return (await this.connection.db!.admin().listDatabases()).databases;

      case 'collections':
        return (await this.connection.db!.listCollections().toArray()).map(c => c.name);

      case 'users':
        try {
          const users = await this.connection.db!.admin().command({ usersInfo: 1 });
          return users.users || [];
        } catch {
          throw new Error('Insufficient privileges to show users');
        }

      case 'roles':
        try {
          const roles = await this.connection.db!.admin().command({ rolesInfo: 1 });
          return roles.roles || [];
        } catch {
          throw new Error('Insufficient privileges to show roles');
        }

      default:
        throw new Error(`Unsupported show command: show ${showType}`);
    }
  }

  /**
   * Execute database-level operations
   */
  private async executeDbOperation(operation: string, args: any[]): Promise<any> {
    const db = this.connection.db!;

    switch (operation) {
      case 'stats':
        return await db.stats();

      case 'serverStatus':
        return await db.admin().serverStatus();

      case 'createUser':
        if (args.length < 1) throw new Error('createUser requires user document');
        return await db.admin().command({
          createUser: args[0].user,
          pwd: args[0].pwd,
          roles: args[0].roles || [],
        });

      case 'dropUser':
        if (args.length < 1) throw new Error('dropUser requires username');
        return await db.admin().removeUser(args[0]);

      case 'createCollection':
        if (args.length < 1) throw new Error('createCollection requires collection name');
        return await db.createCollection(args[0], args[1] || {});

      case 'dropDatabase':
        return await db.dropDatabase();

      case 'runCommand':
        if (args.length < 1) throw new Error('runCommand requires command object');
        return await db.admin().command(args[0]);

      default:
        throw new Error(`Unsupported database operation: ${operation}`);
    }
  }

  /**
   * Execute collection operations
   */
  private async executeCollectionOperation(
    model: mongoose.Model<any>,
    operation: string,
    args: any[],
    chainedOperations?: ChainedOperation[],
  ): Promise<any> {
    let query: any;

    switch (operation) {
      case 'find': {
        const findQuery = args[0] || {};
        const projection = args[1] || {};
        query = model.find(findQuery, projection);
        break;
      }

      case 'findOne':
        query = model.findOne(args[0] || {}, args[1] || {});
        break;

      case 'findById':
        if (args.length < 1) throw new Error('findById requires an id');
        query = model.findById(args[0], args[1] || {});
        break;

      case 'insertOne': {
        if (args.length < 1) throw new Error('insertOne requires a document');
        const insertResult = await model.create(args[0]);
        return { insertedId: insertResult._id, acknowledged: true };
      }

      case 'insertMany': {
        if (args.length < 1) throw new Error('insertMany requires documents array');
        const insertManyResult = await model.insertMany(args[0], args[1] || {});
        return {
          insertedIds: insertManyResult.map(doc => doc._id),
          insertedCount: insertManyResult.length,
          acknowledged: true,
        };
      }

      case 'updateOne':
        if (args.length < 2) throw new Error('updateOne requires filter and update');
        return await model.updateOne(args[0], args[1], args[2] || {});

      case 'updateMany':
        if (args.length < 2) throw new Error('updateMany requires filter and update');
        return await model.updateMany(args[0], args[1], args[2] || {});

      case 'replaceOne':
        if (args.length < 2) throw new Error('replaceOne requires filter and replacement');
        return await model.replaceOne(args[0], args[1], args[2] || {});

      case 'deleteOne':
        if (args.length < 1) throw new Error('deleteOne requires a filter');
        return await model.deleteOne(args[0]);

      case 'deleteMany':
        if (args.length < 1) throw new Error('deleteMany requires a filter');
        return await model.deleteMany(args[0]);

      case 'aggregate':
        if (args.length < 1) throw new Error('aggregate requires pipeline array');
        return await model.aggregate(args[0]);

      case 'countDocuments':
        return await model.countDocuments(args[0] || {});

      case 'estimatedDocumentCount':
        return await model.estimatedDocumentCount();

      case 'distinct':
        if (args.length < 1) throw new Error('distinct requires field name');
        return await model.distinct(args[0], args[1] || {});

      case 'createIndex':
        if (args.length < 1) throw new Error('createIndex requires index specification');
        return await model.collection.createIndex(args[0], args[1] || {});

      case 'createIndexes':
        if (args.length < 1) throw new Error('createIndexes requires index specifications array');
        return await model.collection.createIndexes(args[0]);

      case 'dropIndex':
        if (args.length < 1) throw new Error('dropIndex requires index specification');
        return await model.collection.dropIndex(args[0]);

      case 'dropIndexes':
        return await model.collection.dropIndexes();

      case 'getIndexes':
        return await model.collection.indexes();

      case 'drop':
        return await model.collection.drop();

      case 'stats':
        return await this.connection.db!.command({ collStats: model.collection.collectionName });

      case 'validate':
        return await this.connection.db!.command({ validate: model.collection.collectionName });

      default:
        throw new Error(`Unsupported collection operation: ${operation}`);
    }

    if (chainedOperations && chainedOperations.length > 0 && query) {
      for (const chainedOp of chainedOperations) {
        query = this.applyChainedOperation(query, chainedOp);
      }
    }

    if (query) {
      if (
        typeof query.lean === 'function' &&
        (operation === 'find' || operation === 'findOne' || operation === 'findById')
      ) {
        return await query.lean();
      }
      return await query;
    }

    throw new Error(`Operation ${operation} did not return a result`);
  }

  /**
   * Apply a chained operation to a query
   */
  private applyChainedOperation(query: any, chainedOp: ChainedOperation): any {
    const { method, args } = chainedOp;

    switch (method) {
      case 'limit':
        if (args.length < 1) throw new Error('limit requires a number');
        return query.limit(args[0]);

      case 'skip':
        if (args.length < 1) throw new Error('skip requires a number');
        return query.skip(args[0]);

      case 'sort':
        if (args.length < 1) throw new Error('sort requires a sort specification');
        return query.sort(args[0]);

      case 'select':
      case 'project':
        if (args.length < 1) throw new Error('select/project requires field specification');
        return query.select(args[0]);

      case 'populate':
        if (args.length < 1) throw new Error('populate requires path specification');
        return query.populate(args[0]);

      case 'lean':
        return query.lean();

      case 'exec':
        return query;

      case 'count':
        return query.countDocuments();

      case 'distinct':
        if (args.length < 1) throw new Error('distinct requires field name');
        return query.distinct(args[0]);

      default:
        throw new Error(`Unsupported chained operation: ${method}`);
    }
  }

  /**
   * Get or create a mongoose model for the collection.
   * Keep an explicit map to avoid name normalization/pluralization side effects.
   */
  private getModel(collectionName: string): mongoose.Model<any> {
    const modelName = this.getModelName(collectionName);
    const existingModel = this.connection.models[modelName];
    if (existingModel) {
      return existingModel as mongoose.Model<any>;
    }

    const schema = new mongoose.Schema({}, { strict: false, collection: collectionName });
    return this.connection.model(modelName, schema, collectionName);
  }

  private getModelName(collectionName: string): string {
    const cached = this.modelNameMap.get(collectionName);
    if (cached) {
      return cached;
    }

    const safeName = collectionName.replace(/[^a-zA-Z0-9_]/g, '_') || 'collection';
    let candidate = `shell_${safeName}`;
    let suffix = 1;

    while (
      this.connection.models[candidate] &&
      this.connection.models[candidate].collection.collectionName !== collectionName
    ) {
      candidate = `shell_${safeName}_${suffix}`;
      suffix++;
    }

    this.modelNameMap.set(collectionName, candidate);
    return candidate;
  }
}
