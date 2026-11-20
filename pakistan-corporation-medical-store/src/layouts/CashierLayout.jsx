import { LayoutDashboard, ShoppingCart, History, Undo2, Wallet } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { AssignedBranchChip } from '../components/layout/BranchControl'
import { useDemo } from '../context/DemoContext'
import { computeAlerts } from '../utils/alerts'
import { BRANCH_BY_ID } from '../data/demoData'

export const CASHIER_SECTIONS = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/cashier', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Billing',
    items: [{ label: 'POS Billing', path: '/cashier/pos', icon: ShoppingCart }],
  },
  {
    title: 'Records',
    items: [
      { label: 'Sales History', path: '/cashier/history', icon: History },
      { label: 'Refunds & Returns', path: '/cashier/returns', icon: Undo2 },
      { label: 'Daily Cash Summary', path: '/cashier/cash-summary', icon: Wallet },
    ],
  },
]

export const CASHIER_PAGES = CASHIER_SECTIONS.flatMap((s) => s.items.map((i) => ({ label: i.label, path: i.path })))

export default function CashierLayout() {
  const { state, session } = useDemo()
  const branch = BRANCH_BY_ID[session.branchId]
  const alerts = computeAlerts(state, session.branchId, { ordersPath: '/cashier/pos', inventoryPath: '/cashier/pos' })
  const user = { name: 'Cashier · ' + (branch?.cashier || 'Staff'), title: branch?.name || '', initials: (branch?.cashier || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2) }
  return (
    <AppShell
      sections={CASHIER_SECTIONS}
      roleLabel="Cashier Panel"
      user={user}
      pages={CASHIER_PAGES}
      alerts={alerts}
      showMedicineSearch={false}
      branchControl={<AssignedBranchChip branchId={session.branchId} />}
    />
  )
}
