const formatSeconds = (seconds: number | string) => {
  const sn = Number(seconds)
  if (sn === -1 || !sn) {
    return 'No Limit'
  }

  if (sn <= 0) {
    return 'Expired'
  }

  if (sn < 60) {
    return `${Math.floor(sn)}s`;
  }

  if (sn < 60 * 60) {
    return `${Math.floor(sn / 60)}min`;
  }
  
  if (sn < 60 * 60 * 24) {
    return `${Math.floor(sn / 60 / 60)}h`;
  }
  
  return `${Math.floor(sn / 60 / 60 / 24)}d`;
}

export default formatSeconds
