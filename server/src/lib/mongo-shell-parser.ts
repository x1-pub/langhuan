/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose from 'mongoose';

interface ParsedCommand {
  database?: string;
  collection: string;
  operation: string;
  args: any[];
  chainedOperations?: ChainedOperation[];
}

interface ChainedOperation {
  method: string;
  args: any[];
}

export class MongoShellParser {
  private connection: mongoose.Connection;

  constructor(connection: mongoose.Connection) {
    this.connection = connection;
  }

  /**
   * Execute a MongoDB shell command
   */
  async executeCommand(command: string): Promise<unknown> {
    // Clean and normalize the command
    const cleanCommand = this.cleanCommand(command);

    // Parse the command
    const parsed = this.parseCommand(cleanCommand);

    // Execute the parsed command
    return this.executeOperation(parsed);
  }

  /**
   * Clean and normalize the command string
   */
  private cleanCommand(command: string): string {
    return command
      .trim()
      .replace(/;\s*$/, '') // Remove trailing semicolon
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Parse MongoDB shell command into structured format
   */
  private parseCommand(command: string): ParsedCommand {
    // Handle different command patterns

    // Database operations: use mydb
    if (command.match(/^use\s+\w+/)) {
      const dbName = command.replace(/^use\s+/, '');
      return this.parseUseCommand(dbName);
    }

    // Show commands: show dbs, show collections, show users
    if (command.startsWith('show ')) {
      return this.parseShowCommand(command);
    }

    // Database admin commands: db.createUser(), db.dropUser(), etc.
    if (command.startsWith('db.') && !command.includes('.')) {
      return this.parseDbAdminCommand(command);
    }

    const collectionMatch = command.match(/^db\.([^.]+)\.(.+)$/);
    if (collectionMatch) {
      const [, collection, operationsString] = collectionMatch;
      return this.parseChainedOperations(collection, operationsString);
    }

    // Database-level operations: db.stats(), db.serverStatus(), etc.
    const dbMatch = command.match(/^db\.(\w+)\((.*)$/);
    if (dbMatch) {
      const [, operation, argsString] = dbMatch;
      const args = this.parseArguments(argsString);
      return {
        collection: '', // No collection for db-level operations
        operation,
        args,
      };
    }

    throw new Error(`Unsupported command format: ${command}`);
  }

  /**
   * Parse use commands
   */
  private parseUseCommand(dbName: string): ParsedCommand {
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
    const showType = command.replace(/^show\s+/, '').trim();
    return {
      collection: '',
      operation: 'show',
      args: [showType],
    };
  }

  /**
   * Parse database admin commands
   */
  private parseDbAdminCommand(command: string): ParsedCommand {
    const operation = command.replace(/^db\./, '').trim();
    const argsString = command.match(/$$(.*)$$$/) ? command.match(/$$(.*)$$$/)![1] : '';
    const args = this.parseArguments(argsString);

    return {
      collection: '',
      operation,
      args,
    };
  }
  /**
   * Parse chained operations like find().limit(10).sort({name: 1})
   */
  private parseChainedOperations(collection: string, operationsString: string): ParsedCommand {
    // Split by method calls while preserving parentheses content
    const methods = this.splitChainedMethods(operationsString);

    if (methods.length === 0) {
      throw new Error(`No operations found in: ${operationsString}`);
    }

    // First method is the main operation
    const firstMethod = methods[0];
    const mainOperation = this.parseMethodCall(firstMethod);

    // Remaining methods are chained operations
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

    for (let i = 0; i < operationsString.length; i++) {
      const char = operationsString[i];
      const prevChar = i > 0 ? operationsString[i - 1] : '';

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }

      if (!inString) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;

          // End of a method call
          if (depth === 0) {
            current += char;
            methods.push(current.trim());
            current = '';

            // Skip the dot if it exists
            if (i + 1 < operationsString.length && operationsString[i + 1] === '.') {
              i++;
            }
            continue;
          }
        }
      }

      current += char;
    }

    // Handle case where there's remaining content (shouldn't happen with proper syntax)
    if (current.trim()) {
      methods.push(current.trim());
    }

    return methods;
  }

  /**
   * Parse a single method call like "find({name: 'John'})"
   */
  private parseMethodCall(methodString: string): ChainedOperation {
    const match = methodString.match(/^(\w+)\((.*)$/);
    if (!match) {
      throw new Error(`Invalid method call format: ${methodString}`);
    }

    const [, method, argsString] = match;
    const args = this.parseArguments(argsString);

    return { method, args };
  }

  /**
   * Parse function arguments, handling JavaScript object syntax
   */
  private parseArguments(argsString: string): any[] {
    const cleanArgs = argsString.replace(/\)$/, '').trim();

    if (!cleanArgs) {
      return [];
    }

    try {
      const normalizedArgs = this.normalizeJavaScriptObjects(cleanArgs);

      // Split arguments by commas, but respect nested objects and arrays
      const args = this.splitArguments(normalizedArgs);

      return args.map(arg => {
        const trimmed = arg.trim();

        // Handle different argument types
        if (trimmed === 'true' || trimmed === 'false') {
          return trimmed === 'true';
        }

        if (trimmed === 'null') {
          return null;
        }

        if (trimmed === 'undefined') {
          return undefined;
        }

        // Numbers
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          return Number.parseFloat(trimmed);
        }

        // Strings (quoted)
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          return trimmed.slice(1, -1);
        }

        // Objects and arrays
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }

        // Unquoted strings (field names, etc.)
        return trimmed;
      });
    } catch (error) {
      throw new Error(`Failed to parse arguments: ${cleanArgs}. Error: ${error}`);
    }
  }

  /**
   * Normalize JavaScript objects to valid JSON
   */
  private normalizeJavaScriptObjects(input: string): string {
    return input.replace(/\{[^}]*\}/g, match => {
      // Add quotes to unquoted property names
      return match.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    });
  }

  /**
   * Split arguments respecting nested structures
   */
  private splitArguments(argsString: string): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      const prevChar = i > 0 ? argsString[i - 1] : '';

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }

      if (!inString) {
        if (char === '{' || char === '[') {
          depth++;
        } else if (char === '}' || char === ']') {
          depth--;
        } else if (char === ',' && depth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
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
  private async executeOperation(parsed: ParsedCommand): Promise<any> {
    const { collection, operation, args, chainedOperations } = parsed;

    // Handle show commands
    if (operation === 'use') {
      return this.executeUseCommand(args[0]);
    }

    // Handle show commands
    if (operation === 'show') {
      return this.executeShowCommand(args[0]);
    }

    // Handle database-level operations
    if (!collection) {
      return this.executeDbOperation(operation, args);
    }

    // Handle collection operations
    const model = this.getModel(collection);
    return this.executeCollectionOperation(model, operation, args, chainedOperations);
  }

  private async executeUseCommand(dbName: string) {
    return `switched to db ${dbName}`;
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
      // return await db.admin().command({ dropUser: args[0] })

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

    // Execute the main operation
    switch (operation) {
      // Query operations that return a query object for chaining
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

      // Operations that don't support chaining - execute immediately
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

      // Index operations
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

      // Collection management
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

    // Execute the final query
    if (query) {
      // Add .lean() for better performance on find operations
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
        // exec() doesn't modify the query, just returns it for execution
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
   * Get or create a mongoose model for the collection
   */
  private getModel(collectionName: string): mongoose.Model<any> {
    try {
      return this.connection.model(collectionName);
    } catch {
      // Create a dynamic model if it doesn't exist
      const schema = new mongoose.Schema({}, { strict: false, collection: collectionName });
      return this.connection.model(collectionName, schema);
    }
  }
}
