const sizeToText = (size: number) => {
  if (size > 1000000) {
    return `${Math.round(size / 1000000)}MB`
  }
  if (size > 1000) {
    return `${Math.round(size / 1000)}KB`
  }
  return `${size}B`
}

export default sizeToText
