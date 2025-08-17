import mongoose from 'mongoose';

export class MongoShellParser {
  private connection: mongoose.Connection;
  private currentDatabase: string;

  constructor(connection: mongoose.Connection) {
    this.connection = connection;
    this.currentDatabase = connection.name || 'test';
  }

  async executeCommand(command: string): Promise<any> {
    const trimmedCommand = command.trim();
    
    // 处理 use database
    const useDbMatch = trimmedCommand.match(/^use\s+(\w+);?$/);
    if (useDbMatch) {
      return await this.useDatabase(useDbMatch[1]);
    }

    // 处理 show 命令
    if (trimmedCommand.startsWith('show ')) {
      return await this.handleShowCommand(trimmedCommand);
    }

    // 处理单独的 db 命令
    if (trimmedCommand === 'db' || trimmedCommand === 'db;') {
      return this.currentDatabase;
    }

    // 处理管理命令 (优先级高于普通db命令)
    const adminCommands = [
      'db.adminCommand',
      'db.runCommand',
      'db.stats',
      'db.serverStatus',
      'db.version',
      'db.getMongo',
      'db.getName',
      'db.dropDatabase'
    ];

    for (const adminCmd of adminCommands) {
      if (trimmedCommand.startsWith(adminCmd)) {
        return await this.handleAdminCommand(trimmedCommand);
      }
    }

    // 处理 db 相关命令 (集合操作)
    if (trimmedCommand.startsWith('db.')) {
      return await this.handleDbCommand(trimmedCommand);
    }

    // 处理用户管理命令
    if (trimmedCommand.includes('createUser') || trimmedCommand.includes('dropUser') || 
        trimmedCommand.includes('updateUser') || trimmedCommand.includes('getUsers')) {
      return await this.handleUserCommand(trimmedCommand);
    }

    // 处理索引命令
    if (trimmedCommand.includes('createIndex') || trimmedCommand.includes('dropIndex') || 
        trimmedCommand.includes('getIndexes')) {
      return await this.handleIndexCommand(trimmedCommand);
    }

    throw new Error(`不支持的命令格式: ${command}`);
  }

  private async useDatabase(dbName: string): Promise<string> {
    this.currentDatabase = dbName;
    await this.connection.useDb(dbName)
    return `switched to db ${dbName}`;
  }

  private async handleShowCommand(command: string): Promise<any> {
    const showMatch = command.match(/^show\s+(\w+);?$/);
    if (!showMatch) {
      throw new Error('无效的show命令格式');
    }

    const [, target] = showMatch;
    
    switch (target) {
      case 'collections':
      case 'tables':
        return await this.showCollections();
      case 'dbs':
      case 'databases':
        return await this.showDatabases();
      case 'users':
        return await this.showUsers();
      case 'roles':
        return await this.showRoles();
      case 'profile':
        return await this.showProfile();
      case 'logs':
        return await this.showLogs();
      default:
        throw new Error(`不支持的show命令: show ${target}`);
    }
  }

  private async showCollections(): Promise<string[]> {
    const collections = await this.connection.db!.listCollections().toArray();
    console.log(collections)
    return collections.map(col => col.name);
  }

  private async showDatabases(): Promise<any> {
    const admin = this.connection.db!.admin();
    const result = await admin.listDatabases();
    return result.databases.map((db: any) => ({
      name: db.name,
      sizeOnDisk: db.sizeOnDisk,
      empty: db.empty
    }));
  }

  private async showUsers(): Promise<any> {
    try {
      const result = await this.connection.db!.admin().command({ usersInfo: 1 });
      return result.users;
    } catch (error) {
      return { error: '需要管理员权限查看用户信息' };
    }
  }

  private async showRoles(): Promise<any> {
    try {
      const result = await this.connection.db!.admin().command({ rolesInfo: 1 });
      return result.roles;
    } catch (error) {
      return { error: '需要管理员权限查看角色信息' };
    }
  }

  private async showProfile(): Promise<any> {
    const result = await this.connection.db!.collection('system.profile').find({}).limit(5).toArray();
    return result;
  }

  private async showLogs(): Promise<any> {
    try {
      const result = await this.connection.db!.admin().command({ getLog: 'global' });
      return result.log.slice(-10); // 返回最后10条日志
    } catch (error) {
      return { error: '需要管理员权限查看日志' };
    }
  }

  private async handleDbCommand(command: string): Promise<any> {
    // 这个方法现在只处理集合操作，管理命令已经在上层处理
    const collectionMatch = command.match(/^db\.(\w+)\.(\w+)\((.*?)\)(?:\.(\w+)\((.*?)\))*;?$/);
    if (collectionMatch) {
      const [, collectionName, operation, params, chainOperation, chainParams] = collectionMatch;
      return await this.executeCollectionOperation(collectionName, operation, params, chainOperation, chainParams);
    }

    throw new Error(`不支持的db命令: ${command}`);
  }

  private async executeCollectionOperation(
    collectionName: string, 
    operation: string, 
    params: string,
    chainOperation?: string,
    chainParams?: string
  ): Promise<any> {
    const model = this.getOrCreateModel(collectionName);
    
    let query: any;
    let parsedParams: any = {};
    
    // 解析参数
    if (params.trim()) {
      try {
        parsedParams = this.parseParams(params);
      } catch (error) {
        throw new Error(`参数解析失败: ${params}`);
      }
    }

    // 执行主要操作
    switch (operation) {
      // 查询操作
      case 'find':
        query = model.find(parsedParams);
        break;
      case 'findOne':
        return await model.findOne(parsedParams);
      case 'findOneAndUpdate':
        const [findUpdateFilter, findUpdateDoc, findUpdateOptions] = this.parseMultipleParams(params);
        return await model.findOneAndUpdate(findUpdateFilter, findUpdateDoc, findUpdateOptions);
      case 'findOneAndDelete':
        return await model.findOneAndDelete(parsedParams);
      case 'findOneAndReplace':
        const [findReplaceFilter, findReplaceDoc, findReplaceOptions] = this.parseMultipleParams(params);
        return await model.findOneAndReplace(findReplaceFilter, findReplaceDoc, findReplaceOptions);

      // 计数操作
      case 'countDocuments':
        return await model.countDocuments(parsedParams);
      case 'estimatedDocumentCount':
        return await model.estimatedDocumentCount();
      case 'count':
        return await model.countDocuments(parsedParams);

      // 插入操作
      case 'insertOne':
        return await model.create(parsedParams);
      case 'insertMany':
        return await model.insertMany(Array.isArray(parsedParams) ? parsedParams : [parsedParams]);
      case 'insert':
        return await model.create(parsedParams);

      // 更新操作
      case 'updateOne':
        const [updateFilter, updateDoc, updateOptions] = this.parseMultipleParams(params);
        return await model.updateOne(updateFilter, updateDoc, updateOptions);
      case 'updateMany':
        const [updateManyFilter, updateManyDoc, updateManyOptions] = this.parseMultipleParams(params);
        return await model.updateMany(updateManyFilter, updateManyDoc, updateManyOptions);
      case 'replaceOne':
        const [replaceFilter, replaceDoc, replaceOptions] = this.parseMultipleParams(params);
        return await model.replaceOne(replaceFilter, replaceDoc, replaceOptions);

      // 删除操作
      case 'deleteOne':
        return await model.deleteOne(parsedParams);
      case 'deleteMany':
        return await model.deleteMany(parsedParams);
      case 'remove':
        return await model.deleteMany(parsedParams);

      // 聚合操作
      case 'aggregate':
        const pipeline = Array.isArray(parsedParams) ? parsedParams : [parsedParams];
        return await model.aggregate(pipeline);

      // 去重操作
      case 'distinct':
        const [distinctField, distinctFilter] = this.parseMultipleParams(params);
        return await model.distinct(distinctField, distinctFilter);

      // 集合管理操作
      case 'drop':
        return await model.collection.drop();
      case 'createIndex':
        const [indexSpec, indexOptions] = this.parseMultipleParams(params);
        return await model.collection.createIndex(indexSpec, indexOptions);
      case 'dropIndex':
        return await model.collection.dropIndex(parsedParams);
      case 'getIndexes':
        return await model.collection.indexes();
      case 'reIndex':
        // reIndex方法在新版本MongoDB驱动中已移除，使用runCommand替代
        return await this.connection.db!.command({ reIndex: collectionName });

      // 批量操作
      case 'bulkWrite':
        return await model.bulkWrite(parsedParams);

      default:
        throw new Error(`不支持的操作: ${operation}`);
    }

    // 处理链式操作
    if (chainOperation && query) {
      switch (chainOperation) {
        case 'limit':
          const limit = parseInt(chainParams || '10') || 10;
          query = query.limit(limit);
          break;
        case 'skip':
          const skip = parseInt(chainParams || '0') || 0;
          query = query.skip(skip);
          break;
        case 'sort':
          const sortParams = this.parseParams(chainParams || '{}');
          query = query.sort(sortParams);
          break;
        case 'select':
        case 'projection':
          const selectParams = this.parseParams(chainParams || '{}');
          query = query.select(selectParams);
          break;
        case 'populate':
          const populateParams = this.parseParams(chainParams || '{}');
          query = query.populate(populateParams);
          break;
        case 'lean':
          query = query.lean();
          break;
        case 'explain':
          return await query.explain();
        case 'count':
          return await query.countDocuments();
      }
    }

    return await query.exec();
  }

  private async handleAdminCommand(command: string): Promise<any> {
    // 处理 db.stats()
    if (command.match(/^db\.stats\(\);?$/)) {
      return await this.connection.db!.stats();
    }

    // 处理 db.getName()
    if (command.match(/^db\.getName\(\);?$/)) {
      return this.currentDatabase;
    }

    // 处理 db.version()
    if (command.match(/^db\.version\(\);?$/)) {
      const result = await this.connection.db!.admin().command({ buildInfo: 1 });
      return result.version;
    }

    // 处理 db.serverStatus()
    if (command.match(/^db\.serverStatus\(\);?$/)) {
      return await this.connection.db!.admin().command({ serverStatus: 1 });
    }

    // 处理 db.dropDatabase()
    if (command.match(/^db\.dropDatabase\(\);?$/)) {
      return await this.connection.db!.dropDatabase();
    }

    // 处理 db.runCommand()
    const runCommandMatch = command.match(/^db\.runCommand\((.*)\);?$/);
    if (runCommandMatch) {
      const commandObj = this.parseParams(runCommandMatch[1]);
      return await this.connection.db!.command(commandObj);
    }

    // 处理 db.adminCommand()
    const adminCommandMatch = command.match(/^db\.adminCommand\((.*)\);?$/);
    if (adminCommandMatch) {
      const commandObj = this.parseParams(adminCommandMatch[1]);
      return await this.connection.db!.admin().command(commandObj);
    }

    throw new Error(`不支持的管理命令: ${command}`);
  }

  private async handleUserCommand(command: string): Promise<any> {
    // 处理 db.createUser()
    const createUserMatch = command.match(/^db\.createUser\((.*)\);?$/);
    if (createUserMatch) {
      const userObj = this.parseParams(createUserMatch[1]);
      return await this.connection.db!.admin().command({ createUser: userObj.user, pwd: userObj.pwd, roles: userObj.roles });
    }

    // 处理 db.dropUser()
    const dropUserMatch = command.match(/^db\.dropUser\("(.+)"\);?$/);
    if (dropUserMatch) {
      return await this.connection.db!.admin().command({ dropUser: dropUserMatch[1] });
    }

    // 处理 db.getUsers()
    if (command.match(/^db\.getUsers\(\);?$/)) {
      const result = await this.connection.db!.admin().command({ usersInfo: 1 });
      return result.users;
    }

    throw new Error(`不支持的用户管理命令: ${command}`);
  }

  private async handleIndexCommand(command: string): Promise<any> {
    const collectionMatch = command.match(/^db\.(\w+)\.(createIndex|dropIndex|getIndexes)\((.*?)\);?$/);
    if (collectionMatch) {
      const [, collectionName, operation, params] = collectionMatch;
      const model = this.getOrCreateModel(collectionName);

      switch (operation) {
        case 'createIndex':
          const [indexSpec, indexOptions] = this.parseMultipleParams(params);
          return await model.collection.createIndex(indexSpec, indexOptions || {});
        case 'dropIndex':
          const indexName = this.parseParams(params);
          return await model.collection.dropIndex(indexName);
        case 'getIndexes':
          return await model.collection.indexes();
      }
    }

    throw new Error(`不支持的索引命令: ${command}`);
  }

  private parseParams(params: string): any {
    if (!params.trim()) return {};
    
    try {
      // 处理MongoDB特殊操作符，将$替换为临时标记
      let processedParams = params.replace(/\$(\w+)/g, '"__DOLLAR__$1"');
      
      // 解析JSON
      let parsed = JSON.parse(processedParams);
      
      // 还原$操作符
      const restoreDollarSigns = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(restoreDollarSigns);
        } else if (obj && typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const newKey = key.replace(/__DOLLAR__/g, '$');
            result[newKey] = restoreDollarSigns(value);
          }
          return result;
        }
        return obj;
      };
      
      return restoreDollarSigns(parsed);
    } catch (error) {
      throw new Error(`JSON解析失败: ${params}`);
    }
  }

  private parseMultipleParams(params: string): any[] {
    if (!params.trim()) return [{}];
    
    try {
      // 简单的参数分割，处理嵌套对象
      const results: any[] = [];
      let currentParam = '';
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < params.length; i++) {
        const char = params[i];
        
        if (escapeNext) {
          currentParam += char;
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          currentParam += char;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          
          if (char === ',' && braceCount === 0) {
            if (currentParam.trim()) {
              results.push(this.parseParams(currentParam.trim()));
            }
            currentParam = '';
            continue;
          }
        }

        currentParam += char;
      }

      if (currentParam.trim()) {
        results.push(this.parseParams(currentParam.trim()));
      }

      return results.length > 0 ? results : [{}];
    } catch (error) {
      // 如果解析失败，尝试简单分割
      const parts = params.split(',').map(p => p.trim());
      return parts.map(part => {
        try {
          return this.parseParams(part);
        } catch {
          return part;
        }
      });
    }
  }

  private getOrCreateModel(collectionName: string): mongoose.Model<any> {
    try {
      return mongoose.model(collectionName);
    } catch (error) {
      // 如果模型不存在，创建一个通用的模型
      const schema = new mongoose.Schema({}, { strict: false, collection: collectionName });
      return mongoose.model(collectionName, schema);
    }
  }
}

export const formatMongoResult = (result: unknown): string => {
  if (result === null || result === undefined) {
    return 'null';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (typeof result === 'number' || typeof result === 'boolean') {
    return result.toString();
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return '[]';
    }

    return JSON.stringify(result, null, 2)
    // // 如果是文档数组，格式化为类似MongoDB shell的输出
    // const formattedItems = result.map((item, index) => {
    //   if (typeof item === 'object' && item !== null) {
    //     return `/* ${index + 1} */\n${JSON.stringify(item, null, 2)}`;
    //   }
    //   return JSON.stringify(item);
    // });

    // return formattedItems.join('\n\n');
  }

  if (typeof result === 'object') {
    // 特殊处理一些MongoDB返回的对象
    if ((result as any).acknowledged !== undefined) {
      return JSON.stringify(result, null, 2)
    }

    // 统计信息格式化
    // if (result.db && result.collections !== undefined) {
    //   return `Database: ${result.db}\nCollections: ${result.collections}\nViews: ${result.views || 0}\nObjects: ${result.objects || 0}\nAvg Obj Size: ${result.avgObjSize || 0}\nData Size: ${result.dataSize || 0}\nStorage Size: ${result.storageSize || 0}\nIndexes: ${result.indexes || 0}\nIndex Size: ${result.indexSize || 0}`;
    // }

    // 默认JSON格式化
    return JSON.stringify(result, null, 2);
  }

  return String(result);
}