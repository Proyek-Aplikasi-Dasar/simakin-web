const isEmpty = (v) => v === null || v === undefined || v === ''

const toNumber = (v) => {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function compare(a, b) {
  const na = toNumber(a)
  const nb = toNumber(b)
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' })
}

export function sortRows(rows, getValue, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    const ea = isEmpty(va)
    const eb = isEmpty(vb)
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1
    return compare(va, vb) * factor
  })
}
