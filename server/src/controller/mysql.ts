import { Context } from 'koa';
import { DatabaseError, QueryTypes, type Sequelize } from 'sequelize';
import XLSX from 'xlsx'

import Connection from '@/model/connection';
import {
  MySQLBaseDTO,
  MySQLSearchDTO,
  MySQLUpdateDTO,
  MySQLInsertOneDTO,
  MySQLBatchDeleteDTO,
  MySQLAddIndexDTO,
  MySQLdeleteIndexDTO,
  MySQLAddCloumnDTO,
  MySQLDeleteColumnDTO,
  ExecuteSQLDTO,
  ExportDTO,
  Format,
  ColumnOrderDTO,
} from '@/dto/mysql';
import { ResourceNotFound } from '@/utils/error';
import mysql from '@/pools/mysql'
import spatialToString from '@/utils/spatial-to-string';
import { formatNonQueryResult, formatQueryResult, getStatementType } from '@/utils/format-sql-result';
import { getReorderTableColumnsSql } from '@/utils/sql-cloumn-order';

interface GetInstanceParams {
  uid: number;
  connectionId: string;
  dbName?: string;
  sessionId?: string;
}

class MysqlController {
  /**
   * 获取 sequelize 的 MySQL 实例
   */
  private async getInstance(config: GetInstanceParams) {
    const { connectionId, dbName, uid, sessionId } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId, type: 'mysql' }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { host, port, username, password } = connection
    const dbConfig = { database: dbName, host, port, username, password, uid, sessionId }
    const sequelize = await mysql.getInstance(dbConfig)

    return sequelize
  }

  /**
   * 转译 MySQL 的表名或列名
   */
  private escapedName(name: string, sequelize: Sequelize) {
    return sequelize.getQueryInterface().quoteIdentifier(name);
  }

  /**
   * 分页查询数据
   */
  list = async (ctx: Context) => {
    const { connectionId, dbName, tableName, condition, current, pageSize } = await new MySQLSearchDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedColumnName = this.escapedName(tableName, sequelize)

    const [list, [count], columns] = await Promise.all([
      sequelize.query(`SELECT * FROM ${escapedColumnName} ${condition} LIMIT ${(current - 1) * pageSize}, ${pageSize}`, { type: QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as nums FROM ${escapedColumnName} ${condition}`, { type: QueryTypes.SELECT }),
      sequelize.query(`SHOW FULL COLUMNS FROM ${escapedColumnName}`, { type: QueryTypes.SELECT })
    ])

    ctx.r({
      data: {
        list,
        columns,
        total: (count as { nums: number }).nums
      }
    })
  }

  /**
   * 根据 condition 批量更新数据
   */
  update = async (ctx: Context) => {
    const { connectionId, dbName, tableName, data, condition } = await new MySQLUpdateDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const replacements: Record<string, any> = {}
    const values = Object
      .keys(data)
      .map((key, idx) => {
        const escapedColumnName = this.escapedName(key, sequelize)
        const valueName = `v_${idx}`
        replacements[valueName] =
          data[key]?.type === 'spatial' ? data[key].value :
            data[key]?.type === 'buffer' ? Buffer.from(data[key].value) :
              data[key]?.type === 'json' ? data[key].value : data[key]
        const op = data[key] == null ? 'IS' : '='
        const valueNameReplace = data[key]?.type === 'spatial' ? `ST_GeomFromText(:${valueName})` : `:${valueName}`
        return `${escapedColumnName} ${op} ${valueNameReplace}`
      })
      .join(', ')

    const where = condition
      .map((con, pIdx) => {
        const oneRow = Object
          .keys(con)
          .map((k, cIdx) => {
            const escapedColumnName = this.escapedName(k, sequelize)
            const valueName = `c_${pIdx}_${cIdx}`
            replacements[valueName] =
              con[k]?.type === 'spatial' ? con[k].value :
                con[k]?.type === 'buffer' ? Buffer.from(con[k].value) :
                  con[k]?.type === 'json' ? con[k].value : con[k]
            const op = con[k] == null ? 'IS' : '='
            const valueNameReplace =
              con[k]?.type === 'spatial' ? `ST_GeomFromText(:${valueName})` :
                con[k]?.type === 'json' ? `CAST(:${valueName} AS JSON)` : `:${valueName}`
            return `${escapedColumnName} ${op} ${valueNameReplace}`
          })
          .join(' AND ')
        return `(${oneRow})`
      })
      .join(' OR ')

    const sql = `UPDATE ${escapedTableName} SET ${values} WHERE ${where} LIMIT ${condition.length}`
    const result = await sequelize.query(sql, { replacements, type: QueryTypes.UPDATE })

    ctx.r({
      data: result[1]
    })
  }

  /**
   * 插入一条数据
   */
  insertOne = async (ctx: Context) => {
    const { connectionId, dbName, tableName, data } = await new MySQLInsertOneDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedColumnName = this.escapedName(tableName, sequelize)
    const replacements: Record<string, any> = {}
    const cloumns = Object.keys(data).map(k => this.escapedName(k, sequelize)).join(', ')

    const values = Object
      .keys(data)
      .map((k, idx) => {
        const valueName = `v_${idx}`
        replacements[valueName] =
          data[k]?.type === 'spatial' ? data[k].value :
            data[k]?.type === 'buffer' ? Buffer.from(data[k].value) :
              data[k]?.type === 'json' ? data[k].value : data[k]
        return data[k]?.type === 'spatial' ? `ST_GeomFromText(:${valueName})` : `:${valueName}`
      })
      .join(', ')

    const sql = `INSERT INTO ${escapedColumnName} (${cloumns}) VALUES (${values})`
    const result = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.INSERT,
    })

    ctx.r({
      data: result[1]
    })
  }

  /**
   * 根据 condition 批量删除
   */
  batchDelete = async (ctx: Context) => {
    const { connectionId, dbName, tableName, condition } = await new MySQLBatchDeleteDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const replacements: Record<string, any> = {}

    const where = condition
      .map((con, pIdx) => {
        const oneRow = Object.keys(con)
          .map((k, cIdx) => {
            const escapedColumnName = this.escapedName(k, sequelize)
            const valueName = `v_${pIdx}_${cIdx}`
            replacements[valueName] =
              con[k]?.type === 'spatial' ? con[k].value :
                con[k]?.type === 'buffer' ? Buffer.from(con[k].value) : con[k]
            const op = con[k] == null ? 'IS' : '='
            const valueNameReplace =
              con[k]?.type === 'spatial' ? `ST_GeomFromText(:${valueName})` :
                con[k]?.type === 'json' ? `CAST(:${valueName} AS JSON)` : `:${valueName}`
            return `${escapedColumnName} ${op} ${valueNameReplace}`
          })
          .join(' AND ')

        return `(${oneRow})`
      })
      .join(' OR ')

    const sql = `DELETE FROM ${escapedTableName} WHERE ${where} LIMIT ${condition.length}`
    const result = await sequelize.query(sql, { replacements })

    ctx.r({
      data: (result[1] as { affectedRows: number })?.affectedRows
    })
  }

  /**
   * SHOW CREATE TABLE
   */
  tableDDL = async (ctx: Context) => {
    const { connectionId, dbName, tableName } = await new MySQLBaseDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const sql = `SHOW CREATE TABLE ${escapedTableName}`
    const result = await sequelize.query(sql, { type: QueryTypes.SHOWTABLES })

    ctx.r({
      data: result[1]
    })
  }

  /**
   * SHOW FULL COLUMNS
   */
  showColumns = async (ctx: Context) => {
    const { connectionId, dbName, tableName } = await new MySQLBaseDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const result = await sequelize.query(`SHOW FULL COLUMNS FROM ${escapedTableName}`, { type: QueryTypes.SELECT })

    ctx.r({
      data: result
    })
  }

  /**
   * SHOW INDEX
   */
  showIndex = async (ctx: Context) => {
    const { connectionId, dbName, tableName } = await new MySQLBaseDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const sql = `SHOW INDEX FROM ${escapedTableName}`
    const result = await sequelize.query(sql, { type: QueryTypes.SELECT })

    ctx.r({
      data: result
    })
  }

  /**
   * 表的一些状态信息
   */
  status = async (ctx: Context) => {
    const { connectionId, dbName, tableName } = await new MySQLBaseDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = sequelize.escape(tableName)
    const escapedDbName = sequelize.escape(dbName)
    const sql = `SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${escapedDbName} AND TABLE_NAME = ${escapedTableName}`
    const result = await sequelize.query(sql, { type: QueryTypes.SELECT })

    ctx.r({
      data: result[0]
    })
  }

  /**
   * 添加索引
   */
  addIndex = async (ctx: Context) => {
    const { connectionId, dbName, tableName, data } = await new MySQLAddIndexDTO().v(ctx)
    const { comment, type, field, name } = data
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const escapedName = name ? this.escapedName(name, sequelize) : ''
    const commentSql = comment ? 'COMMENT :comment' : ''
    const fieldSql = field
      .map(f => {
        let name = this.escapedName(f.name, sequelize)
        if (f.len) {
          name += `(${f.len})`
        }
        if (f.order) {
          name += ` ${f.order}`
        }
        return name
      })
      .join(', ')
    const sql = `ALTER TABLE ${escapedTableName} ADD ${type} ${escapedName} (${fieldSql}) ${commentSql}`
    await sequelize.query(sql, {
      replacements: { comment }
    })

    ctx.r()
  }

  /**
   * 删除索引
   */
  deleteIndex = async (ctx: Context) => {
    const { connectionId, dbName, tableName, name } = await new MySQLdeleteIndexDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const escapedName = this.escapedName(name, sequelize)

    const deleteIndexsql = `ALTER TABLE ${escapedTableName} DROP INDEX ${escapedName}`
    await sequelize.query(deleteIndexsql)

    ctx.r()
  }

  /**
   * 更新索引
   */
  updateIndex = async (ctx: Context) => {
    await this.deleteIndex(ctx)
    await this.addIndex(ctx)
    ctx.r()
  }

  /**
   * 添加或更新一列
   */
  addOrUpdateColumn = async (ctx: Context) => {
    const { connectionId, dbName, tableName, data } = await new MySQLAddCloumnDTO().v(ctx)
    const {
      oldFieldName,
      fieldName,
      fieldType,
      fieldExtra,
      allowNull,
      defaultValue,
      defaultValueType,
      onUpdateCurrentTime,
      isPrimary,
      autoIncrement,
      unsigned,
      zerofill,
      charset,
      collation,
      comment,
    } = data || {}
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })


    // 构建类型部分
    let typeStr = fieldType
    if (fieldExtra) {
      typeStr += `(${fieldExtra})`;
    }

    const attributes: string[] = [];

    // 构建属性部分
    if (unsigned) {
      attributes.push('UNSIGNED');
    }
    if (zerofill) {
      attributes.push('ZEROFILL');
    }
    if (autoIncrement) {
      attributes.push('AUTO_INCREMENT');
    }

    // 处理字符集
    if (charset) {
      attributes.push(`CHARACTER SET ${charset}`);
    }
    if (collation) {
      attributes.push(`COLLATE ${collation}`);
    }

    // 处理空约束
    const nullConstraint = allowNull ? 'NULL' : 'NOT NULL';
    attributes.push(nullConstraint);

    // 处理默认值
    if (defaultValueType !== 'NONE') {
      const v = defaultValueType === 'EMPTY_STRING' ? "''" : defaultValue
      attributes.push(`DEFAULT ${v}`);
    }

    // 处理主键
    if (isPrimary) {
      attributes.push('PRIMARY KEY');
    }

    if (onUpdateCurrentTime) {
      attributes.push('ON UPDATE CURRENT_TIMESTAMP');
    }

    // 处理注释
    if (comment) {
      const v = sequelize.escape(comment)
      attributes.push(`COMMENT ${v}`);
    }

    // 构建完整 SQL
    const escapedTableName = this.escapedName(tableName, sequelize)
    const escapedFieldName = this.escapedName(fieldName, sequelize)
    const escapedOldFieldName = this.escapedName(oldFieldName || '', sequelize)
    const columnKeyword = oldFieldName ? `CHANGE COLUMN ${escapedOldFieldName} ${escapedFieldName}` : `ADD COLUMN ${escapedFieldName}`
    const sqlParts = [
      `ALTER TABLE ${escapedTableName} ${columnKeyword}`,
      typeStr,
      ...attributes
    ];
    const sql = sqlParts.join(' ')

    const result = await sequelize.query(sql)

    ctx.r({
      data: result
    })
  }

  /**
   * 删除一列
   */
  deleteColumn = async (ctx: Context) => {
    const { connectionId, dbName, tableName, name } = await new MySQLDeleteColumnDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedColumnName = this.escapedName(name, sequelize)
    const escapedTableName = this.escapedName(tableName, sequelize)
    const sql = `ALTER TABLE ${escapedTableName} DROP COLUMN ${escapedColumnName};`
    const result = await sequelize.query(sql)

    ctx.r({
      data: result
    })
  }

  /**
   * 执行 SQL
   */
  execute = async (ctx: Context) => {
    const { connectionId, command, sessionId } = await new ExecuteSQLDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, uid: ctx.user.id, sessionId })

    try {
      let result;
      let changeDatabase;
      const [results, metadata] = await sequelize.query(command)
      const type = getStatementType(command);

      if (type === 'query') {
        result = formatQueryResult(results);
      } else {
        result = formatNonQueryResult(type, metadata);
        const db = (metadata as any).stateChanges.schema
        if (type === 'use' && db) {
          changeDatabase = db
        }
      }
      ctx.r({
        data: {
          result,
          changeDatabase,
        },
      })
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw new Error(error.message)
      }
      throw new Error(String(error))
    }
  }

  /**
   * 导出数据
   */
  exportData = async (ctx: Context) => {
    const { connectionId, dbName, tableName, condition, fields, type } = await new ExportDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedColumnName = this.escapedName(tableName, sequelize)
    const columns = await sequelize.query(`SHOW FULL COLUMNS FROM ${escapedColumnName}`, { type: QueryTypes.SELECT })
    const fieldType: Record<string, string> = {}
    columns.forEach((column: any) => fieldType[column.Field] = column.Type)

    const escapedTableName = this.escapedName(tableName, sequelize)
    const replacements: Record<string, any> = {}

    const where = condition
      .map((con, pIdx) => {
        const oneRow = Object.keys(con)
          .map((k, cIdx) => {
            const escapedColumnName = this.escapedName(k, sequelize)
            const valueName = `v_${pIdx}_${cIdx}`
            replacements[valueName] =
              con[k]?.type === 'spatial' ? con[k].value :
                con[k]?.type === 'buffer' ? Buffer.from(con[k].value) : con[k]
            const op = con[k] == null ? 'IS' : '='
            const valueNameReplace =
              con[k]?.type === 'spatial' ? `ST_GeomFromText(:${valueName})` :
                con[k]?.type === 'json' ? `CAST(:${valueName} AS JSON)` : `:${valueName}`
            return `${escapedColumnName} ${op} ${valueNameReplace}`
          })
          .join(' AND ')

        return `(${oneRow})`
      })
      .join(' OR ')

    const sql = `SELECT ${fields.map(field => this.escapedName(field, sequelize))} FROM ${escapedTableName} WHERE ${where} LIMIT ${condition.length}`
    const records = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT })

    ctx.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment;`
    });

    const json: Record<string, any>[] = []
    const insertStatements = records
      .map((record) => {
        const { query, bind } = (sequelize.getQueryInterface().queryGenerator as any).insertQuery(tableName, record) as {
          query: string;
          bind: unknown[];
        };
        const row: Record<string, any> = {}
        const values = bind.map((value, idx) => {
          if (value == null) {
            row[fields[idx]] = null
            return 'NULL'
          }

          if (typeof value !== 'object') {
            row[fields[idx]] = value
            return sequelize.escape((value as any))
          }

          if (Buffer.isBuffer(value)) {
            if (fieldType[fields[idx]].toLocaleUpperCase().startsWith('BIT')) {
              const binaryString16 = value.toString('hex');
              const binaryString2 = parseInt(binaryString16, 16).toString(2);
              const len = Number(fieldType[fields[idx]].slice(4, -1))
              const v = binaryString2.padStart(len, '0')

              row[fields[idx]] = v
              return `b'${v}'`
            }

            if (type !== Format.SQL && !fieldType[fields[idx]].toLocaleUpperCase().includes('BLOB')) {
              const data = [...value]
              let lastNonZeroIndex = data.length - 1;
              while (lastNonZeroIndex >= 0 && data[lastNonZeroIndex] === 0) {
                lastNonZeroIndex--;
              }
              const validData = data.slice(0, lastNonZeroIndex + 1);
              const v = Buffer.from(validData).toString()
              row[fields[idx]] = v
              return v
            }

            row[fields[idx]] = value.toString('base64')
            return `FROM_BASE64('${value.toString('base64')}')`
          }

          if (fieldType[fields[idx]] === 'json') {
            row[fields[idx]] = JSON.stringify(value)
            return `'${JSON.stringify(value)}'`
          }

          row[fields[idx]] = spatialToString(value)

          return `ST_GeomFromText('${spatialToString(value)}')`
        }).join(',')

        json.push(row)
        const fill = query.replace(/\sVALUES\s\((.*)\);$/, ` VALUES(${values});`)
        return fill
      })
      .join('\n')

    if (type === Format.SQL) {
      ctx.body = insertStatements
      return
    }

    if (type === Format.JSON) {
      ctx.body = json
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(json);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    ctx.body = excelBuffer
  }

  columnOrder = async (ctx: Context) => {
    const { connectionId, dbName, tableName, fields } = await new ColumnOrderDTO().v(ctx)
    const sequelize = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const escapedTableName = this.escapedName(tableName, sequelize)
    const sql = `SHOW CREATE TABLE ${escapedTableName}`
    const ddlResult = await sequelize.query(sql, { type: QueryTypes.SHOWTABLES })
    const ddl = ddlResult[1]

    const orderSql = getReorderTableColumnsSql(ddl, tableName, fields)
    await sequelize.query(orderSql)

    ctx.r()
  }
}

export default new MysqlController()
