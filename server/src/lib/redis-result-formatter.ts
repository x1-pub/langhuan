export const formatRedisResult = (result: unknown): string => {
  if (result === null) return '(nil)';

  if (typeof result === 'boolean') {
    return result ? '1' : '0';
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return '(empty array)';
    }

    return result.map((v, i) => `${i + 1}) ${formatRedisResult(v)}`).join('\n');
  }

  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }

  return String(result);
};
