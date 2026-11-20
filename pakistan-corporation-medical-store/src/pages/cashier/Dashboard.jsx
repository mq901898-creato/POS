import { useMemo } from 'react'
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import { Receipt, Banknote, Wallet, Clock, ArrowRight, ShoppingCart } from 'lucide-react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import { CompareBarChart } from '../../components/charts/Charts'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { filterSales, summarize } from '../../utils/analytics'
import { fmtDay, fmtTime, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function CashierDashboard() {
  const { allSales, state, session } = useDemo()
  const navigate = useNavigate()
  const branch = BRANCH_BY_ID[session.branchId]
  const today = toDayKey(ANCHOR)
  const todays = useMemo(() => filterSales(allSales, { branchId: session.branchId, from: today, to: today }), [allSales, session.branchId, today])
  const s = useMemo(() => summarize(todays), [todays])
  const pending = state.orders.filter((o) => o.branchId === session.branchId && o.status === 'Pending')
  const pendingValue = pending.reduce((sum, o) => sum + o.items.reduce((a, i) => a + i.qty * i.price, 0), 0)
  const hourly = useMemo(() => {
    const b = Array.from({ length: 13 }, (_, i) => ({ label: `${9 + i}h`, sales: 0 }))
    todays.forEach((x) => {
      const h = new Date(x.createdAt).getHours() - 9
      if (h >= 0 && h < b.length) b[h].sales += x.total
    })
    return b.map((x) => ({ ...x, sales: Math.round(x.sales) }))
  }, [todays])

  return (
    <>
      <PageHeader
        breadcrumbs={['Cashier', 'Dashboard']}
        title={`Good evening, ${branch.cashier.split(' ')[0]}`}
        subtitle={`${branch.name} · ${fmtDay(today)} · shift summary`}
        actions={<Button component={RouterLink} to="/cashier/pos" variant="contained" startIcon={<ShoppingCart size={16} />}>Open POS</Button>}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 2, mb: 2.5 }}>
        <KpiCard label="Today's transactions" value={s.count} hint={`${s.refundCount} refunded`} icon={Receipt} tone="blue" />
        <KpiCard label="Today's sales" value={formatPKR(s.gross)} hint={`Net ${formatPKR(s.net)}`} icon={Banknote} tone="teal" />
        <KpiCard label="Cash collected" value={formatPKR(s.cash)} hint="Cash payments today" icon={Wallet} tone="green" />
        <KpiCard label="Pending payments" value={pending.length} hint={`${formatPKR(pendingValue)} awaiting billing`} icon={Clock} tone="amber" />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Sales by hour · today" subtitle="Gross invoice value per hour">
            <CompareBarChart data={hourly} xKey="label" series={[{ key: 'sales', label: 'Sales', color: palette.blue }]} height={260} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="Incoming orders"
            subtitle="Prepared by the sales counter"
            action={<Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/cashier/pos')}>Billing</Button>}
          >
            <Stack spacing={1.25}>
              {pending.length === 0 && <Typography variant="body2" color="text.secondary">No orders waiting. The sales counter has nothing pending.</Typography>}
              {pending.map((o) => (
                <Stack key={o.id} direction="row" sx={{ p: 1.5, border: `1px solid ${palette.border}`, borderRadius: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{o.id} · {o.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.items.length} lines · {formatPKR(o.items.reduce((a, i) => a + i.qty * i.price, 0))} · by {o.by}</Typography>
                  </Box>
                  <Chip size="small" color="info" label="Pending" />
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Panel title="Recent transactions" subtitle="Your branch's latest invoices" noPad>
            <Box sx={{ p: 2 }}>
              <DataTable
                dense
                rowsPerPage={8}
                columns={[
                  { id: 'id', label: 'Invoice', render: (x) => <Typography variant="caption" fontWeight={600}>{x.id}</Typography> },
                  { id: 'time', label: 'Time', render: (x) => fmtTime(x.createdAt), sortable: false },
                  { id: 'customer', label: 'Customer', render: (x) => x.customerName },
                  { id: 'payment', label: 'Payment', render: (x) => x.payment, sortable: false },
                  { id: 'total', label: 'Amount', align: 'right', sortValue: (x) => x.total, render: (x) => formatPKR(x.total) },
                  { id: 'status', label: 'Status', render: (x) => <StatusChip status={x.status} />, sortable: false },
                ]}
                rows={todays.slice(0, 10)}
              />
            </Box>
          </Panel>
        </Grid>
      </Grid>
    </>
  )
}
