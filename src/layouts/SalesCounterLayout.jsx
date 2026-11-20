import { LayoutDashboard, Pill, PackagePlus, ClipboardList } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { AssignedBranchChip } from '../components/layout/BranchControl'
import { useDemo } from '../context/DemoContext'
import { computeAlerts } from '../utils/alerts'
import { BRANCH_BY_ID } from '../data/demoData'

export const SALES_SECTIONS = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/sales', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Counter',
    items: [
      { label: 'Medicine Catalogue', path: '/sales/medicines', icon: Pill },
      { label: 'Create Order', path: '/sales/new-order', icon: PackagePlus },
      { label: 'My Orders', path: '/sales/orders', icon: ClipboardList },
    ],
  },
]

export const SALES_PAGES = SALES_SECTIONS.flatMap((s) => s.items.map((i) => ({ label: i.label, path: i.path })))

export default function SalesCounterLayout() {
  const { state, session } = useDemo()
  const branch = BRANCH_BY_ID[session.branchId]
  const alerts = computeAlerts(state, session.branchId, { inventoryPath: '/sales/medicines', ordersPath: '/sales/orders' })
  const user = { name: 'Sales Counter · ' + (branch?.salesCounter || 'Staff'), title: branch?.name || '', initials: (branch?.salesCounter || 'S').split(' ').map((w) => w[0]).join('').slice(0, 2) }
  return (
    <AppShell
      sections={SALES_SECTIONS}
      roleLabel="Sales Counter"
      user={user}
      pages={SALES_PAGES}
      alerts={alerts}
      showMedicineSearch
      medicineSearchPath="/sales/medicines"
      branchControl={<AssignedBranchChip branchId={session.branchId} />}
    />
  )
}
