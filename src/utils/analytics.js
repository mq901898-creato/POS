import { BRANCHES, MEDICINE_BY_ID, MONTHLY_ARCHIVE, toDayKey, addDays, ANCHOR } from '../data/demoData'
import { daysFromAnchor } from './format'

// ------------------------------------------------------------ inventory status
export const EXPIRY_WINDOW_DAYS = 90

export function inventoryStatus(row) {
  const med = MEDICINE_BY_ID[row.medicineId]
  const days = daysFromAnchor(row.expiry)
  if (days < 0) return 'Expired'
  if (row.qty === 0) return 'Out of Stock'
  if (med && row.qty < med.minStock) return 'Low Stock'
  if (days <= EXPIRY_WINDOW_DAYS) return 'Expiring Soon'
  return 'In Stock'
}

export const isLowStock = (row) => {
  const med = MEDICINE_BY_ID[row.medicineId]
  return !!med && row.qty < med.minStock
}
export const isExpiringSoon = (row) => {
  const d = daysFromAnchor(row.expiry)
  return d >= 0 && d <= EXPIRY_WINDOW_DAYS
}
export const isExpired = (row) => daysFromAnchor(row.expiry) < 0

// ------------------------------------------------------------ sales filtering & summaries
export function filterSales(sales, { branchId = 'all', from, to } = {}) {
  return sales.filter((s) => {
    if (branchId !== 'all' && s.branchId !== branchId) return false
    const local = localKey(s.createdAt)
    if (from && local < from) return false
    if (to && local > to) return false
    return true
  })
}

// Local calendar day key for an ISO timestamp
export function localKey(iso) {
  return toDayKey(new Date(iso))
}

export function summarize(list) {
  const out = {
    count: list.length,
    gross: 0,
    refunds: 0,
    net: 0,
    profit: 0,
    cash: 0,
    card: 0,
    wallet: 0,
    bank: 0,
    online: 0,
    refundCount: 0,
    unitsSold: 0,
  }
  list.forEach((s) => {
    out.gross += s.total
    out.refunds += s.refundAmount || 0
    if (s.status === 'Refunded') out.refundCount += 1
    if (s.status === 'Completed') {
      const cost = s.items.reduce((c, it) => c + it.qty * it.cost, 0)
      out.profit += s.total - cost
      out.unitsSold += s.items.reduce((c, it) => c + it.qty, 0)
      if (s.payment === 'Cash') out.cash += s.total
      if (s.payment === 'Card') out.card += s.total
      if (s.payment === 'Mobile Wallet') out.wallet += s.total
      if (s.payment === 'Bank Transfer') out.bank += s.total
    }
  })
  out.net = out.gross - out.refunds
  out.online = out.wallet + out.bank
  out.avgTicket = out.count ? out.gross / out.count : 0
  return out
}

export function groupByDay(list) {
  const map = {}
  list.forEach((s) => {
    const k = localKey(s.createdAt)
    if (!map[k]) map[k] = []
    map[k].push(s)
  })
  return map
}

export function groupByBranch(list) {
  return BRANCHES.map((b) => ({ branch: b, ...summarize(list.filter((s) => s.branchId === b.id)) }))
}

export function dailySeries(sales, days, branchId = 'all') {
  const byDay = groupByDay(filterSales(sales, { branchId }))
  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(ANCHOR, -i)
    const k = toDayKey(d)
    const s = summarize(byDay[k] || [])
    series.push({
      key: k,
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      sales: Math.round(s.gross),
      refunds: Math.round(s.refunds),
      net: Math.round(s.net),
      profit: Math.round(s.profit),
      orders: s.count,
    })
  }
  return series
}

// Monthly totals combining archived summaries (Jan–Aug) and detailed sales (Sep onward)
export function monthlySeries(sales, branchId = 'all') {
  const months = []
  for (let m = 0; m < 11; m++) months.push(`2026-${String(m + 1).padStart(2, '0')}`)
  return months.map((month) => {
    const archived = MONTHLY_ARCHIVE.filter((r) => r.month === month && (branchId === 'all' || r.branchId === branchId))
    if (archived.length) {
      const sum = archived.reduce(
        (a, r) => ({ sales: a.sales + r.sales, refunds: a.refunds + r.refunds, profit: a.profit + r.profit, orders: a.orders + r.orders }),
        { sales: 0, refunds: 0, profit: 0, orders: 0 }
      )
      return { month, label: monthLabel(month), ...sum, net: sum.sales - sum.refunds, source: 'archive' }
    }
    const list = filterSales(sales, { branchId, from: `${month}-01`, to: `${month}-31` })
    const s = summarize(list)
    const partial = month === '2026-11' ? ' (MTD)' : ''
    return { month, label: monthLabel(month) + partial, sales: s.gross, refunds: s.refunds, net: s.net, profit: s.profit, orders: s.count, source: 'detailed' }
  })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthLabel = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

export function topMedicines(sales, limit = 6) {
  const map = {}
  sales.forEach((s) => {
    if (s.status !== 'Completed') return
    s.items.forEach((it) => {
      if (!map[it.medicineId]) map[it.medicineId] = { medicineId: it.medicineId, name: it.name, qty: 0, revenue: 0 }
      map[it.medicineId].qty += it.qty
      map[it.medicineId].revenue += it.qty * it.price
    })
  })
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// ------------------------------------------------------------ inventory summaries
export function branchInventorySummary(inventory, branchId) {
  const rows = inventory.filter((r) => r.branchId === branchId)
  return {
    skus: rows.length,
    units: rows.reduce((s, r) => s + r.qty, 0),
    value: rows.reduce((s, r) => s + r.qty * (MEDICINE_BY_ID[r.medicineId]?.purchasePrice || 0), 0),
    lowStock: rows.filter(isLowStock).length,
    expiring: rows.filter(isExpiringSoon).length,
    expired: rows.filter(isExpired).length,
  }
}

// Units that can be sold from one branch: every non-expired batch of the medicine.
export function availableUnits(inventory, branchId, medicineId) {
  return inventory
    .filter((r) => r.branchId === branchId && r.medicineId === medicineId && !isExpired(r))
    .reduce((s, r) => s + r.qty, 0)
}

// Earliest-expiring non-expired batch at a branch (used for batch info on cards)
export function nearestBatch(inventory, branchId, medicineId) {
  const rows = inventory
    .filter((r) => r.branchId === branchId && r.medicineId === medicineId && r.qty > 0)
    .sort((a, b) => (a.expiry < b.expiry ? -1 : 1))
  return rows[0] || null
}
