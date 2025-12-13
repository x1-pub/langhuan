import { type Sequelize } from 'sequelize';
import { pickBy } from 'lodash';

export const removeNullAndUndefined = (obj: object) => {
  return pickBy(obj, value => value !== null && value !== undefined);
};

export const escapedMySQLName = (name: string, sequelize: Sequelize) => {
  return sequelize.getQueryInterface().quoteIdentifier(name);
};
