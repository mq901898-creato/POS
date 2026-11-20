/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import * as D from '../data/demoData'
import { MEDICINE_BY_ID, toDayKey, addDays, ANCHOR } from '../data/demoData'

// Demo-only persistence. Nothing here is sent to a server.
const STORAGE_KEY = 'pcms-demo-v2'

const uid = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(10 + Math.random() * 89)}`

const seedState = () => ({
  session: null, // { role: 'owner'|'cashier'|'sales', branchId: 'all' | branch id }
  medicines: D.MEDICINES,
  inventory: D.INVENTORY,
  salesExtra: [], // invoices created during this demo session
  saleOverrides: {}, // changes (refunds) applied to seeded invoices
  purchases: D.PURCHASE_ORDERS,
  suppliers: D.SUPPLIERS,
  orders: D.INITIAL_ORDERS,
  transfers: D.INITIAL_TRANSFERS,
  adjustments: D.INITIAL_ADJUSTMENTS,
  notices: [],
})

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw)
    return { ...seedState(), ...parsed }
  } catch {
    return seedState()
  }
}

// ----------------------------------------------------------- inventory helpers
// Deduct qty from a branch's stock of one medicine, soonest-expiring batch first (FIFO by expiry).
function deductStock(inventory, branchId, medicineId, qty) {
  let remaining = qty
  const rows = inventory
    .filter((r) => r.branchId === branchId && r.medicineId === medicineId && r.qty > 0)
    .sort((a, b) => (a.expiry < b.expiry ? -1 : 1))
  const take = {}
  for (const r of rows) {
    if (remaining <= 0) break
    const t = Math.min(r.qty, remaining)
    take[r.id] = t
    remaining -= t
  }
  return inventory.map((r) => (take[r.id] ? { ...r, qty: r.qty - take[r.id] } : r))
}

function addStock(inventory, branchId, medicineId, qty, batchNo, expiry) {
  if (qty <= 0) return inventory
  const existing = inventory.find((r) => r.branchId === branchId && r.medicineId === medicineId && r.batchNo === batchNo)
  if (existing) return inventory.map((r) => (r.id === existing.id ? { ...r, qty: r.qty + qty } : r))
  const m = MEDICINE_BY_ID[medicineId]
  return [
    ...inventory,
    {
      id: uid('INV'),
      medicineId,
      branchId,
      batchNo: batchNo || `B${(m?.id || 'X').slice(-3)}${Math.floor(1000 + Math.random() * 8999)}`,
      expiry: expiry || toDayKey(addDays(ANCHOR, 540)),
      qty,
    },
  ]
}

// ----------------------------------------------------------- reducer
function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, session: { role: action.role, branchId: action.branchId } }
    case 'LOGOUT':
      return { ...state, session: null }
    case 'SET_VIEW_BRANCH':
      return { ...state, session: { ...state.session, branchId: action.branchId } }
    case 'NOTICE':
      return { ...state, notices: [{ id: uid('N'), text: action.text, tone: action.tone || 'info', at: new Date().toISOString() }, ...state.notices].slice(0, 30) }
    case 'CLEAR_NOTICES':
      return { ...state, notices: [] }

    case 'ADD_MEDICINE': {
      const { medicine, stock } = action
      const inventory = stock && stock.qty > 0 ? addStock(state.inventory, stock.branchId, medicine.id, stock.qty, stock.batchNo, stock.expiry) : state.inventory
      return { ...state, medicines: [...state.medicines, medicine], inventory }
    }
    case 'UPDATE_MEDICINE':
      return { ...state, medicines: state.medicines.map((m) => (m.id === action.medicine.id ? { ...m, ...action.medicine } : m)) }
    case 'DELETE_MEDICINE':
      return {
        ...state,
        medicines: state.medicines.filter((m) => m.id !== action.id),
        inventory: state.inventory.filter((r) => r.medicineId !== action.id),
      }
    case 'ADJUST_STOCK': {
      const { inventoryId, delta, reason } = action
      const inventory = state.inventory.map((r) => (r.id === inventoryId ? { ...r, qty: Math.max(0, r.qty + delta) } : r))
      const adjustments = [{ id: uid('ADJ'), inventoryId, delta, reason, date: toDayKey(ANCHOR) }, ...state.adjustments]
      return { ...state, inventory, adjustments }
    }

    case 'COMPLETE_SALE': {
      const sale = action.sale
      let inventory = state.inventory
      sale.items.forEach((it) => {
        inventory = deductStock(inventory, sale.branchId, it.medicineId, it.qty)
      })
      const orders = action.orderId
        ? state.orders.map((o) => (o.id === action.orderId ? { ...o, status: 'Completed', invoice: sale.id } : o))
        : state.orders
      return { ...state, salesExtra: [sale, ...state.salesExtra], inventory, orders }
    }
    case 'REFUND_SALE': {
      const { id, reason } = action
      const extra = state.salesExtra.find((s) => s.id === id)
      const base = extra || D.SALES.find((s) => s.id === id)
      if (!base || base.status === 'Refunded') return state
      const patch = { status: 'Refunded', refundAmount: base.total, refundReason: reason }
      let inventory = state.inventory
      base.items.forEach((it) => {
        const row = inventory.filter((r) => r.branchId === base.branchId && r.medicineId === it.medicineId).sort((a, b) => (a.expiry < b.expiry ? -1 : 1))[0]
        if (row) inventory = inventory.map((r) => (r.id === row.id ? { ...r, qty: r.qty + it.qty } : r))
      })
      return {
        ...state,
        inventory,
        salesExtra: extra ? state.salesExtra.map((s) => (s.id === id ? { ...s, ...patch } : s)) : state.salesExtra,
        saleOverrides: extra ? state.saleOverrides : { ...state.saleOverrides, [id]: patch },
      }
    }

    case 'SEND_ORDER':
      return { ...state, orders: [action.order, ...state.orders] }
    case 'SET_ORDER_STATUS':
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)) }

    case 'CREATE_PO':
      return { ...state, purchases: [action.po, ...state.purchases] }
    case 'APPROVE_PO':
      return { ...state, purchases: state.purchases.map((p) => (p.id === action.id ? { ...p, status: 'Ordered' } : p)) }
    case 'RECEIVE_PO': {
      const po = state.purchases.find((p) => p.id === action.id)
      if (!po) return state
      let inventory = state.inventory
      const items = po.items.map((it) => {
        const remaining = it.qty - it.received
        if (remaining > 0) {
          inventory = addStock(inventory, po.branchId, it.medicineId, remaining, `GRN${po.id.slice(-4)}${it.medicineId.slice(-3)}`, toDayKey(addDays(ANCHOR, 540)))
        }
        return { ...it, received: it.qty }
      })
      const purchases = state.purchases.map((p) => (p.id === action.id ? { ...p, items, status: 'Received', receivedOn: toDayKey(ANCHOR) } : p))
      return { ...state, purchases, inventory }
    }
    case 'RECORD_PAYMENT': {
      const purchases = state.purchases.map((p) => {
        if (p.id !== action.id) return p
        const paid = Math.min(p.total, p.paid + action.amount)
        return { ...p, paid, paymentHistory: [...p.paymentHistory, { date: toDayKey(ANCHOR), amount: action.amount, method: action.method }] }
      })
      return { ...state, purchases }
    }

    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.supplier] }
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.supplier.id ? { ...s, ...action.supplier } : s)) }

    case 'CREATE_TRANSFER':
      return { ...state, transfers: [action.transfer, ...state.transfers] }
    case 'UPDATE_TRANSFER': {
      const t = state.transfers.find((x) => x.id === action.id)
      if (!t) return state
      let inventory = state.inventory
      if (t.status === 'Awaiting Dispatch' && action.status === 'In Transit') {
        inventory = deductStock(inventory, t.from, t.medicineId, t.qty)
      }
      if (t.status === 'In Transit' && action.status === 'Received') {
        const src = state.inventory.find((r) => r.branchId === t.from && r.medicineId === t.medicineId)
        inventory = addStock(inventory, t.to, t.medicineId, t.qty, `TRF${t.id.slice(-4)}`, src?.expiry)
      }
      return {
        ...state,
        inventory,
        transfers: state.transfers.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)),
      }
    }

    case 'RESET':
      return { ...seedState(), session: state.session }
    default:
      return state
  }
}

// ----------------------------------------------------------- context
const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — demo still works in memory */
    }
  }, [state])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    clearTimeout(timers.current[id])
  }, [])

  const notify = useCallback(
    (text, tone = 'success') => {
      const id = uid('T')
      setToasts((t) => [...t.slice(-2), { id, text, tone }])
      timers.current[id] = setTimeout(() => dismissToast(id), 3200)
      dispatch({ type: 'NOTICE', text, tone })
    },
    [dismissToast]
  )

  // Every invoice across the demo: seeded history (with overrides) + invoices created in this session
  const allSales = useMemo(() => {
    const base = D.SALES.map((s) => (state.saleOverrides[s.id] ? { ...s, ...state.saleOverrides[s.id] } : s))
    return [...state.salesExtra, ...base]
  }, [state.salesExtra, state.saleOverrides])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      session: state.session,
      role: state.session?.role,
      branchId: state.session?.branchId,
      allSales,
      toasts,
      notify,
      dismissToast,
      login: (role, branchId) => dispatch({ type: 'LOGIN', role, branchId }),
      logout: () => dispatch({ type: 'LOGOUT' }),
      setViewBranch: (branchId) => dispatch({ type: 'SET_VIEW_BRANCH', branchId }),
      resetDemo: () => {
        dispatch({ type: 'RESET' })
        notify('Demo data restored to its original state', 'info')
      },
    }),
    [state, allSales, toasts, notify, dismissToast]
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}

export { uid }
