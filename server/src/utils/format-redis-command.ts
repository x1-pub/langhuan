export const formatRedisResult = (result: unknown): string => {
  if (result === null) return "(nil)";

  if (typeof result === "boolean") {
    return result ? "1" : "0"
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return "(empty array)"
    }

    return result.map((v, i) => `${i + 1}) ${formatRedisResult(v)}`).join("\n");
  }

  if (typeof result === "object") {
    return JSON.stringify(result, null, 2);
  }

  return String(result);
}

export const parseRedisCommand = (command: string): string[] => {
  const parts: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""

  for (let i = 0; i < command.length; i++) {
    const char = command[i]

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true
      quoteChar = char
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false
      quoteChar = ""
    } else if (!inQuotes && char === " ") {
      if (current.trim()) {
        parts.push(current.trim())
        current = ""
      }
    } else {
      current += char
    }
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}