import { pickBy } from 'lodash';

export const removeNullAndUndefined = <T extends object>(object: T) => {
  return pickBy(object, value => value !== null && value !== undefined) as Partial<T>;
};
