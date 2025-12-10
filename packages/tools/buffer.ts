/**
 * 将 Buffer 转换为 UTF-8 字符串（适用于存储文本的 BINARY/VARBINARY 字段）
 * @param buffer - Sequelize 返回的 Buffer（可能为 null/undefined）
 * @returns 转换后的 UTF-8 字符串，空值返回空字符串
 */
export function bufferToUtf8(buffer: Buffer | null | undefined): string {
  if (!buffer || buffer.length === 0) {
    return '';
  }
  return buffer.toString('utf8');
}

/**
 * 将 Buffer 转换为 Base64 字符串（适用于 BLOB/TINYBLOB/mediumblob/longblob 字段）
 * @param buffer - Sequelize 返回的 Buffer（可能为 null/undefined）
 * @returns 转换后的 Base64 字符串，空值返回空字符串
 */
export function bufferToBase64(buffer: Buffer | null | undefined): string {
  if (!buffer || buffer.length === 0) {
    return '';
  }
  return buffer.toString('base64');
}

/**
 * 将 Buffer 转换为固定长度的二进制字符串（适用于 BIT(n) 字段，自动前补 0）
 * @param buffer - Sequelize 返回的 Buffer（可能为 null/undefined）
 * @param bitLength - BIT 字段定义的长度（必须是正整数，如 3、8、16）
 * @returns 固定长度的二进制字符串，空值返回空字符串
 * @throws 若 bitLength 不是正整数，抛出参数错误
 */
export function bufferToBitString(buffer: Buffer | null | undefined, bitLength: number): string {
  if (!Number.isInteger(bitLength) || bitLength <= 0) {
    throw new Error('bitLength 必须是大于 0 的整数');
  }

  if (!buffer || buffer.length === 0) {
    return '';
  }

  // 手动转 BigInt（逐字节）
  let big = 0n;
  for (let i = 0; i < buffer.length; i += 1) {
    big = (big << 8n) + BigInt(buffer[i]);
  }

  const binaryStr = big.toString(2);

  return binaryStr.padStart(bitLength, '0');
}

/**
 * Buffer → 十六进制串（带 0x 前缀）
 */
export function bufferToHex(buffer: Buffer | null | undefined): string {
  if (!buffer) return '';
  return `0x${buffer.toString('hex')}`;
}
