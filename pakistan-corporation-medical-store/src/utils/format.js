import { ANCHOR, MEDICINE_BY_ID } from '../data/demoData'

export const formatPKR = (n) => `Rs. ${Math.round(n || 0).toLocaleString('en-US')}`

export const formatCompactPKR = (n) => {
  const v = n || 0
  if (Math.abs(v) >= 1e7) return `Rs. ${(v / 1e7).toFixed(2)} Cr`
  if (Math.abs(v) >= 1e5) return `Rs. ${(v / 1e5).toFixed(2)} L`
  if (Math.abs(v) >= 1e3) return `Rs. ${(v / 1e3).toFixed(1)}K`
  return `Rs. ${Math.round(v)}`
}

export const formatNumber = (n) => Math.round(n || 0).toLocaleString('en-US')

// 'YYYY-MM-DD' -> '18 Nov 2026'
export function fmtDay(key) {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// Days from the demo anchor date to a 'YYYY-MM-DD' key (negative = already past)
export function daysFromAnchor(key) {
  const [y, m, d] = key.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const anchor = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth(), ANCHOR.getDate())
  return Math.round((target - anchor) / 86400000)
}

export const medicineName = (id) => MEDICINE_BY_ID[id]?.name ?? id

export const todayKey = () => {
  const d = ANCHOR
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
