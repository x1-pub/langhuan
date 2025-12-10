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

    return JSON.stringify(result, null, 2);
  }

  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }

  return String(result);
};
