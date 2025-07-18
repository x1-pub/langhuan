const spatialToString = (v: any) => {
  if (!v?.type) {
    return null
  }

  const deep: (coor: any) => string = (coor: any) => {
    if (Object.prototype.toString.call(coor) === '[object Object]') {
      return `${coor.type.toLocaleUpperCase()}(${deep(coor.coordinates || coor.geometries)})`
    }

    if (Number(coor[0]) === coor[0]) {
      return coor.join(' ')
    } else {
      if (Array.isArray(coor[0][0])) {
        return coor.map((c: any) => `(${deep(c)})`).join(', ')
      }
      return coor.map((c: any) => deep(c)).join(', ')
    }
  }

  return deep(v)
}

export default spatialToString
