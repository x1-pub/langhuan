import { TriggerData } from "@/dto/mysql";

export const generateTriggerSQL = (values: TriggerData, triggerName: string, tableName: string): string => {
  const {
    event,
    timing,
    statement,
  } = values;

  let sql = '';

  sql += `CREATE TRIGGER ${triggerName}\n`;
  sql += `${timing} ${event} ON ${tableName}\n`;
  sql += 'FOR EACH ROW\n';
  sql += statement;

  return sql;
};
