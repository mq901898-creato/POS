import { LayoutDashboard, Store, BarChart3, Package, ClipboardList, Truck, Sparkles, ArrowLeftRight } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { OwnerBranchSelect } from '../components/layout/BranchControl'
import { useDemo } from '../context/DemoContext'
import { computeAlerts } from '../utils/alerts'
import { DEMO_USERS } from '../data/demoData'

export const OWNER_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/owner', icon: LayoutDashboard, end: true },
      { label: 'AI Assistant', path: '/owner/assistant', icon: Sparkles, badge: 'AI', badgeTone: 'info' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Branches', path: '/owner/branches', icon: Store },
      { label: 'Inventory', path: '/owner/inventory', icon: Package },
      { label: 'Stock Transfers', path: '/owner/transfers', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Finance',
    items: [{ label: 'Sales Reports', path: '/owner/reports', icon: BarChart3 }],
  },
  {
    title: 'Procurement',
    items: [
      { label: 'Purchases', path: '/owner/purchases', icon: ClipboardList },
      { label: 'Suppliers', path: '/owner/suppliers', icon: Truck },
    ],
  },
]

export const OWNER_PAGES = OWNER_SECTIONS.flatMap((s) => s.items.map((i) => ({ label: i.label, path: i.path })))

export default function OwnerLayout() {
  const { state, session, setViewBranch } = useDemo()
  const scope = session.branchId || 'all'
  const alerts = computeAlerts(state, scope, {
    inventoryPath: '/owner/inventory',
    purchasesPath: '/owner/purchases',
    transfersPath: '/owner/transfers',
    showBranchStatus: true,
  })
  const user = { name: DEMO_USERS.owner.name, title: DEMO_USERS.owner.title, initials: 'TM' }
  return (
    <AppShell
      sections={OWNER_SECTIONS}
      roleLabel="Owner Panel"
      user={user}
      pages={OWNER_PAGES}
      alerts={alerts}
      showMedicineSearch
      medicineSearchPath="/owner/inventory"
      branchControl={<OwnerBranchSelect value={scope} onChange={setViewBranch} />}
    />
  )
}
