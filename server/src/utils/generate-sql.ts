interface AddColumnOptions {
  /** 字段名称 */
  columnName: string;

  /** 字段类型（如 `INT`, `VARCHAR`, `DECIMAL`） */
  type: string;

  /** 字段长度（整数类型为显示宽度，浮点/字符串为精度） */
  length?: number;

  /** 小数位数（仅浮点/定点类型有效） */
  decimal?: number;

  /** 是否无符号（仅数值类型有效） */
  unsigned?: boolean;

  zeroFill?: boolean;

  notNull?: boolean;

  /** 默认值（需符合字段类型格式） */
  defaultValue?: string | number | boolean | null;

  /** 是否自增（仅整数类型有效） */
  autoIncrement?: boolean;

  /** 字符集（如 `utf8mb4`） */
  charset?: string;

  /** 排序规则（如 `utf8mb4_unicode_ci`） */
  collate?: string;
  
  /** 是否二进制（二进制类型或字符串的二进制属性） */
  // binary?: boolean;
}

const generateAddColumnSql = (tableName: string, options: AddColumnOptions) => {
  const {
    columnName,
    type,
    length,
    decimal,
    unsigned,
    zeroFill,
    notNull,
    defaultValue,
    autoIncrement,
    charset,
    collate,
    // binary,
  } = options;

  // 校验必填参数
  if (!tableName || !columnName || !type) {
    throw new Error("表名、字段名和字段类型为必填参数");
  }

  // 构建字段类型定义
  let typeDef = type.toUpperCase();

  // 处理长度和小数
  if (length != null) {
    typeDef += `(${length}`;
    if (decimal != null) {
      typeDef += `,${decimal})`; // 如 FLOAT(8,3) DECIMAL(10,2)
    } else {
      typeDef += ")"; // 如 VARCHAR(255)
    }
  } else if (decimal != null) {
    throw new Error("小数位数需与长度配合使用（如 DECIMAL FLOAT 类型）");
  }

  // 不为null
  if (notNull) {
    typeDef += ' NOT NULL'
  }

  // 处理无符号
  if (unsigned) {
    typeDef += " UNSIGNED";
  }

  if (zeroFill) {
    typeDef += " ZEROFILL";
  }

  // 处理自增
  if (autoIncrement) {
    typeDef += " AUTO_INCREMENT";
  }

  // 处理二进制
  // if (binary) {
  //   if (/TEXT|BLOB/.test(typeDef)) {
  //     throw new Error("二进制属性不适用于 TEXT/BLOB 类型");
  //   }
  //   typeDef += " BINARY";
  // }

  // 处理字符集和排序规则
  if (charset) typeDef += ` CHARACTER SET ${charset}`;
  if (collate) typeDef += ` COLLATE ${collate}`;

  // 处理默认值
  let defaultValueClause = "";
  if (defaultValue !== undefined) {
    let formattedValue;
    if (defaultValue === null) {
      formattedValue = "NULL";
    } else if (typeof defaultValue === "string") {
      // 处理特殊默认值（如 CURRENT_TIMESTAMP）
      if (/^CURRENT_(TIMESTAMP|DATE|TIME)$/i.test(defaultValue)) {
        formattedValue = defaultValue.toUpperCase();
      } else {
        formattedValue = `'${defaultValue.replace(/'/g, "''")}'`; // 转义单引号
      }
    } else if (typeof defaultValue === "boolean") {
      formattedValue = defaultValue ? "1" : "0";
    } else {
      formattedValue = defaultValue.toString();
    }
    defaultValueClause = ` DEFAULT ${formattedValue}`;
  }

  // 构建完整 SQL
  return `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${typeDef}${defaultValueClause};`;
}

generateAddColumnSql('test_langhuange', {
  columnName: 'id',
  type: 'int'
})
generateAddColumnSql('test_langhuange', {
  columnName: 'id',
  type: 'int',
  length: 10,
})
generateAddColumnSql('test_langhuange', {
  columnName: 'id',
  type: 'int',
  length: 10,
  decimal: 2,
  defaultValue: 'cc',
  autoIncrement: true,
  notNull: true,
  unsigned: true,
  zeroFill: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci',
})
