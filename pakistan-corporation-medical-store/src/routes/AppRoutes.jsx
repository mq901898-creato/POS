import { Navigate, Route, Routes } from 'react-router-dom'
import { useDemo } from '../context/DemoContext'
import RoleSelect from '../pages/auth/RoleSelect'
import OwnerLayout from '../layouts/OwnerLayout'
import CashierLayout from '../layouts/CashierLayout'
import SalesCounterLayout from '../layouts/SalesCounterLayout'
import OwnerDashboard from '../pages/owner/Dashboard'
import Branches from '../pages/owner/Branches'
import SalesReports from '../pages/owner/SalesReports'
import Inventory from '../pages/owner/Inventory'
import Purchases from '../pages/owner/Purchases'
import Suppliers from '../pages/owner/Suppliers'
import Transfers from '../pages/owner/Transfers'
import AIAssistant from '../pages/owner/AIAssistant'
import CashierDashboard from '../pages/cashier/Dashboard'
import POS from '../pages/cashier/POS'
import SalesHistory from '../pages/cashier/SalesHistory'
import Returns from '../pages/cashier/Returns'
import CashSummary from '../pages/cashier/CashSummary'
import SalesDashboard from '../pages/sales-counter/Dashboard'
import MedicineCatalogue from '../pages/sales-counter/Medicines'
import CreateOrder from '../pages/sales-counter/CreateOrder'
import Orders from '../pages/sales-counter/Orders'
import NotFound from '../pages/NotFound'

// Each panel is only reachable with its own role; anything else returns to the role selector.
function RequireRole({ role, children }) {
  const { role: current } = useDemo()
  if (current !== role) return <Navigate to="/" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />

      <Route path="/owner" element={<RequireRole role="owner"><OwnerLayout /></RequireRole>}>
        <Route index element={<OwnerDashboard />} />
        <Route path="branches" element={<Branches />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="reports" element={<SalesReports />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="assistant" element={<AIAssistant />} />
      </Route>

      <Route path="/cashier" element={<RequireRole role="cashier"><CashierLayout /></RequireRole>}>
        <Route index element={<CashierDashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="history" element={<SalesHistory />} />
        <Route path="returns" element={<Returns />} />
        <Route path="cash-summary" element={<CashSummary />} />
      </Route>

      <Route path="/sales" element={<RequireRole role="sales"><SalesCounterLayout /></RequireRole>}>
        <Route index element={<SalesDashboard />} />
        <Route path="medicines" element={<MedicineCatalogue />} />
        <Route path="new-order" element={<CreateOrder />} />
        <Route path="orders" element={<Orders />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
