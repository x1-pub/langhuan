import type { Sequelize } from 'sequelize';

export const escapedMySQLName = (name: string, sequelize: Sequelize) => {
  return sequelize.getQueryInterface().quoteIdentifier(name);
};
