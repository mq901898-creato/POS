import { BRANCHES, BRANCH_BY_ID } from '../data/demoData'
import { isExpired, isExpiringSoon, isLowStock } from './analytics'

/**
 * Builds the alert list shown in the notification bell and dashboards.
 * scope: 'all' or a branch id. Options choose the deep links for each role.
 */
export function computeAlerts(state, scope = 'all', opts = {}) {
  const { inventoryPath, ordersPath, purchasesPath, transfersPath, showBranchStatus = false } = opts
  const alerts = []
  const inScope = (r) => scope === 'all' || r.branchId === scope
  const rows = state.inventory.filter(inScope)

  const branches = scope === 'all' ? BRANCHES : [BRANCH_BY_ID[scope]].filter(Boolean)

  const low = rows.filter(isLowStock)
  if (low.length) {
    const medCount = new Set(low.map((r) => r.medicineId)).size
    alerts.push({
      id: 'low',
      tone: 'warning',
      title: `${medCount} medicine${medCount > 1 ? 's' : ''} below minimum stock`,
      text: scope === 'all' ? `${low.length} batches across ${new Set(low.map((r) => r.branchId)).size} branches` : `${low.length} batches need restocking`,
      path: inventoryPath,
    })
  }

  const expSoon = rows.filter(isExpiringSoon)
  if (expSoon.length) {
    alerts.push({
      id: 'expiring',
      tone: 'warning',
      title: `${expSoon.length} batch${expSoon.length > 1 ? 'es' : ''} expiring within 90 days`,
      text: 'Plan promotions or returns before expiry',
      path: inventoryPath,
    })
  }

  const expired = rows.filter(isExpired)
  if (expired.length) {
    alerts.push({
      id: 'expired',
      tone: 'danger',
      title: `${expired.length} expired batch${expired.length > 1 ? 'es' : ''} on shelf records`,
      text: 'Quarantine and remove from sale immediately',
      path: inventoryPath,
    })
  }

  if (showBranchStatus) {
    branches
      .filter((b) => b.status === 'Offline')
      .forEach((b) => alerts.push({ id: `off-${b.id}`, tone: 'danger', title: `${b.name} is offline`, text: b.sync, path: '/owner/branches' }))
  }

  const pendingOrders = state.orders.filter((o) => o.status === 'Pending' && (scope === 'all' || o.branchId === scope))
  if (pendingOrders.length && ordersPath) {
    alerts.push({ id: 'orders', tone: 'info', title: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting at billing`, text: 'Prepared by the sales counter', path: ordersPath })
  }

  const approvals = state.purchases.filter((p) => p.status === 'Pending Approval')
  if (approvals.length && purchasesPath) {
    alerts.push({ id: 'po', tone: 'warning', title: `${approvals.length} purchase order${approvals.length > 1 ? 's' : ''} pending approval`, text: 'Review and approve supplier orders', path: purchasesPath })
  }

  const transfers = state.transfers.filter((t) => t.status !== 'Received' && (scope === 'all' || t.from === scope || t.to === scope))
  if (transfers.length && transfersPath) {
    alerts.push({ id: 'tr', tone: 'info', title: `${transfers.length} stock transfer${transfers.length > 1 ? 's' : ''} in progress`, text: 'Between branches', path: transfersPath })
  }

  return alerts
}
