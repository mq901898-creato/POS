import { useMemo } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { ClipboardList, Pill, PackagePlus, PackageCheck, Clock } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { availableUnits, filterSales, summarize, isLowStock, isExpiringSoon, localKey } from '../../utils/analytics'
import { fmtDay, fmtTime, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function SalesDashboard() {
  const { state, allSales, session } = useDemo()
  const branch = BRANCH_BY_ID[session.branchId]
  const today = toDayKey(ANCHOR)
  const orders = state.orders.filter((o) => o.branchId === session.branchId)
  const pending = orders.filter((o) => o.status === 'Pending')
  const sold = useMemo(() => summarize(filterSales(allSales, { branchId: session.branchId, from: today, to: today })), [allSales, session.branchId, today])
  const unitsSold = useMemo(() => {
    return filterSales(allSales, { branchId: session.branchId, from: today, to: today })
      .filter((s) => s.status === 'Completed')
      .reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0)
  }, [allSales, session.branchId, today])
  const available = state.medicines.filter((m) => availableUnits(state.inventory, session.branchId, m.id) > 0).length
  const alertRows = state.inventory.filter((r) => r.branchId === session.branchId && (isLowStock(r) || isExpiringSoon(r)))

  return (
    <>
      <PageHeader
        breadcrumbs={['Sales counter', 'Dashboard']}
        title={`Welcome, ${branch.salesCounter.split(' ')[0]}`}
        subtitle={`${branch.name} · ${fmtDay(today)}`}
        actions={<Button component={RouterLink} to="/sales/new-order" variant="contained" startIcon={<PackagePlus size={16} />}>Create order</Button>}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2.5 }}>
        <KpiCard label="Today's orders" value={orders.filter((o) => localKey(o.createdAt) === today).length} hint={`${sold.count} invoices billed`} icon={ClipboardList} tone="blue" />
        <KpiCard label="Medicines sold" value={unitsSold} hint="Units, completed invoices" icon={Pill} tone="teal" />
        <KpiCard label="Pending orders" value={pending.length} hint="Waiting at billing" icon={Clock} tone="amber" />
        <KpiCard label="Available products" value={`${available} / ${state.medicines.length}`} hint="With stock in this branch" icon={PackageCheck} tone="green" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5 }}>
        <Panel title="Recent orders" subtitle="Orders you have prepared at this counter" noPad>
          <Box sx={{ p: 2 }}>
            <DataTable
              dense
              rowsPerPage={6}
              columns={[
                { id: 'id', label: 'Order', render: (o) => <Typography variant="caption" fontWeight={600}>{o.id}</Typography> },
                { id: 'customer', label: 'Customer', render: (o) => o.customerName },
                { id: 'lines', label: 'Items', align: 'right', render: (o) => o.items.reduce((s, i) => s + i.qty, 0), sortable: false },
                { id: 'time', label: 'Time', render: (o) => fmtTime(o.createdAt), sortable: false },
                { id: 'status', label: 'Status', render: (o) => <StatusChip status={o.status} />, sortable: false },
              ]}
              rows={orders}
              emptyTitle="No orders yet"
              emptyText="Create an order from the Create Order screen."
            />
          </Box>
        </Panel>
        <Panel title="Stock watch" subtitle="Low-stock and expiring batches at your branch">
          <Stack spacing={1}>
            {alertRows.length === 0 && <Typography variant="body2" color="text.secondary">Nothing needs attention right now.</Typography>}
            {alertRows.slice(0, 7).map((r) => {
              const m = state.medicines.find((x) => x.id === r.medicineId)
              return (
                <Stack key={r.id} direction="row" sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{m?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Batch {r.batchNo} · exp {fmtDay(r.expiry)} · {r.qty} units</Typography>
                  </Box>
                  <StatusChip status={isLowStock(r) ? 'Low Stock' : 'Expiring Soon'} />
                </Stack>
              )
            })}
          </Stack>
        </Panel>
      </Box>
    </>
  )
}
