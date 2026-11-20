import { useMemo } from 'react'
import { Avatar, Box, Chip, Grid, LinearProgress, Stack, Typography, Button } from '@mui/material'
import { Banknote, Wallet, TrendingUp, Pill, Store, PackageX, CalendarClock, Receipt, ShoppingBag, ArrowRight, Activity } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import { TrendChart, CompareBarChart } from '../../components/charts/Charts'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, BRANCH_BY_ID, MEDICINE_BY_ID, ANCHOR, toDayKey, addDays } from '../../data/demoData'
import { filterSales, summarize, dailySeries, monthlySeries, topMedicines, groupByBranch, isLowStock, isExpiringSoon } from '../../utils/analytics'
import { formatPKR, formatCompactPKR, fmtDay, fmtDateTime, fmtTime } from '../../utils/format'
import { palette } from '../../styles/theme'

const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : 0)
const deltaLabel = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

export default function OwnerDashboard() {
  const { allSales, state, session } = useDemo()
  const scope = session.branchId || 'all'
  const scopeLabel = scope === 'all' ? 'Consolidated · all five branches' : BRANCH_BY_ID[scope].name
  const today = toDayKey(ANCHOR)
  const yesterday = toDayKey(addDays(ANCHOR, -1))
  const monthStart = '2026-11-01'
  const lastMonthStart = '2026-10-01'
  const lastMonthEnd = '2026-10-18'

  const figures = useMemo(() => {
    const t = summarize(filterSales(allSales, { branchId: scope, from: today, to: today }))
    const y = summarize(filterSales(allSales, { branchId: scope, from: yesterday, to: yesterday }))
    const m = summarize(filterSales(allSales, { branchId: scope, from: monthStart, to: today }))
    const lm = summarize(filterSales(allSales, { branchId: scope, from: lastMonthStart, to: lastMonthEnd }))
    const series = dailySeries(allSales, 14, scope)
    const monthly = monthlySeries(allSales, scope).slice(-6)
    const ytdNet = monthlySeries(allSales, scope).reduce((s, r) => s + r.net, 0)
    const byBranch = groupByBranch(filterSales(allSales, { from: monthStart, to: today }))
    return { t, y, m, lm, series, monthly, ytdNet, byBranch }
  }, [allSales, scope, today, yesterday])

  const inScope = (r) => scope === 'all' || r.branchId === scope
  const lowRows = state.inventory.filter(inScope).filter(isLowStock)
  const expRows = state.inventory.filter(inScope).filter(isExpiringSoon).sort((a, b) => (a.expiry < b.expiry ? -1 : 1))
  const lowMedicines = new Set(lowRows.map((r) => r.medicineId)).size
  const expMedicines = new Set(expRows.map((r) => r.medicineId)).size
  const pendingCounter = state.orders.filter((o) => o.status === 'Pending' && inScope(o)).length
  const openPOs = state.purchases.filter((p) => ['Pending Approval', 'Ordered', 'Partially Received'].includes(p.status)).length
  const top = topMedicines(filterSales(allSales, { branchId: scope, from: monthStart, to: today }), 6)
  const recent = filterSales(allSales, { branchId: scope }).slice(0, 8)
  const branchBars = figures.byBranch.map((b) => ({ label: b.branch.name.replace('Branch ', 'B'), name: b.branch.name, gross: Math.round(b.gross), net: Math.round(b.net) }))
  const monthBars = figures.monthly.map((r) => ({ label: r.label.replace(' 2026', ''), sales: Math.round(r.sales), profit: Math.round(r.profit) }))
  const activity = [
    ...state.notices.slice(0, 4).map((n) => ({ id: n.id, text: n.text, at: n.at, tone: n.tone })),
    ...recent.slice(0, 4).map((s) => ({ id: s.id, text: `Invoice ${s.id} · ${formatPKR(s.total)} · ${BRANCH_BY_ID[s.branchId].name}`, at: s.createdAt, tone: 'success' })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8)

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Dashboard']}
        title="Business overview"
        subtitle={`${scopeLabel} · figures as of ${fmtDay(today)}, 9:30 PM (demo snapshot)`}
        actions={<Button component={RouterLink} to="/owner/reports" variant="outlined" color="inherit" sx={{ color: 'text.primary', borderColor: 'divider' }} endIcon={<ArrowRight size={15} />}>Open sales reports</Button>}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 2, mb: 2.5 }}>
        <KpiCard label="Total sales today" value={formatPKR(figures.t.gross)} hint={`${figures.t.count} invoices`} delta={deltaLabel(pct(figures.t.gross, figures.y.gross))} icon={Banknote} tone="blue" />
        <KpiCard label="Total sales this month" value={formatCompactPKR(figures.m.gross)} hint="1 – 18 Nov" delta={deltaLabel(pct(figures.m.gross, figures.lm.gross))} icon={Receipt} tone="teal" />
        <KpiCard label="Total revenue (YTD, net)" value={formatCompactPKR(figures.ytdNet)} hint="After refunds · Jan–Nov" icon={Wallet} tone="navy" />
        <KpiCard label="Estimated gross profit" value={formatCompactPKR(figures.m.profit)} hint={`${figures.m.gross ? ((figures.m.profit / figures.m.gross) * 100).toFixed(1) : 0}% margin · MTD`} icon={TrendingUp} tone="green" />
        <KpiCard label="Total medicines" value={state.medicines.length} hint="In catalogue" icon={Pill} tone="blue" />
        <KpiCard label="Total branches" value={BRANCHES.length} hint={`${BRANCHES.filter((b) => b.status === 'Online').length} online · ${BRANCHES.filter((b) => b.status !== 'Online').length} other`} icon={Store} tone="teal" />
        <KpiCard label="Low stock medicines" value={lowMedicines} hint={`${lowRows.length} batches below minimum`} icon={PackageX} tone="amber" />
        <KpiCard label="Expiring medicines" value={expMedicines} hint={`${expRows.length} batches within 90 days`} icon={CalendarClock} tone="red" />
        <KpiCard label="Total orders (MTD)" value={figures.m.count} hint={`Avg ticket ${formatPKR(figures.m.avgTicket)}`} icon={ShoppingBag} tone="blue" />
        <KpiCard label="Pending orders" value={pendingCounter + openPOs} hint={`${pendingCounter} counter · ${openPOs} purchase`} icon={Activity} tone="amber" />
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Panel title="Sales overview · last 14 days" subtitle="Gross invoice value and net revenue after refunds" action={<Chip size="small" label={scopeLabel.split('·')[0].trim()} variant="outlined" />}>
            <TrendChart data={figures.series} series={[{ key: 'sales', label: 'Gross sales', color: palette.blue }, { key: 'net', label: 'Net revenue', color: palette.teal }]} height={280} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Daily & monthly comparison" subtitle="Current period against the previous one">
            <Stack spacing={2}>
              <CompareRow label="Today vs yesterday" cur={figures.t.gross} prev={figures.y.gross} curLabel="Today" prevLabel="Yesterday" />
              <CompareRow label="November vs October" cur={figures.m.gross} prev={figures.lm.gross} curLabel="Nov 1–18" prevLabel="Oct 1–18 (same days)" />
              <Box sx={{ pt: 1, borderTop: `1px solid ${palette.border}` }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Refunds this month</Typography>
                <Stack direction="row" sx={{ mt: 0.5, justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="h2">{formatPKR(figures.m.refunds)}</Typography>
                  <Typography variant="caption" color="text.secondary">{figures.m.refundCount} invoices refunded</Typography>
                </Stack>
              </Box>
              <Box sx={{ pt: 1, borderTop: `1px solid ${palette.border}` }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Payment mix · MTD</Typography>
                <PaymentMix s={figures.m} />
              </Box>
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="Monthly sales performance" subtitle="Last six months · gross sales and estimated profit">
            <CompareBarChart data={monthBars} series={[{ key: 'sales', label: 'Gross sales', color: palette.blue }, { key: 'profit', label: 'Est. profit', color: palette.teal }]} height={280} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="Branch-wise sales · November" subtitle="Gross sales to date, by branch">
            <CompareBarChart data={branchBars} xKey="label" series={[{ key: 'gross', label: 'Gross sales', color: palette.navy }]} height={280} />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="Top-selling medicines" subtitle="Revenue this month (completed invoices)">
            <Stack spacing={1.75}>
              {top.length === 0 && <Typography variant="body2" color="text.secondary">No sales in this period.</Typography>}
              {top.map((t, i) => (
                <Box key={t.medicineId}>
                  <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="body2" fontWeight={600}>{i + 1}. {t.name}</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatPKR(t.revenue)}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(t.revenue / top[0].revenue) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: '#EEF2F8', '& .MuiLinearProgress-bar': { bgcolor: palette.blue } }} />
                  <Typography variant="caption" color="text.secondary">{t.qty} units · {MEDICINE_BY_ID[t.medicineId]?.category}</Typography>
                </Box>
              ))}
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Recent transactions" subtitle="Latest invoices across the selected scope" noPad>
            <Box sx={{ px: 2, pb: 2 }}>
              <DataTable
                dense
                rowsPerPage={8}
                columns={[
                  { id: 'id', label: 'Invoice', render: (r) => <Typography variant="caption" fontWeight={600}>{r.id}</Typography> },
                  { id: 'branch', label: 'Branch', render: (r) => BRANCH_BY_ID[r.branchId].name, sortable: false },
                  { id: 'customer', label: 'Customer', render: (r) => r.customerName },
                  { id: 'time', label: 'Time', render: (r) => fmtTime(r.createdAt), sortable: false },
                  { id: 'total', label: 'Amount', align: 'right', sortValue: (r) => r.total, render: (r) => formatPKR(r.total) },
                  { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
                ]}
                rows={recent.slice(0, 8)}
              />
            </Box>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Low-stock alerts" subtitle="Batches below the branch minimum" action={<Button component={RouterLink} to="/owner/inventory" size="small">Inventory</Button>}>
            <AlertList rows={lowRows.slice(0, 6)} empty="No low-stock batches in this scope." render={(r) => ({ title: MEDICINE_BY_ID[r.medicineId].name, sub: `${BRANCH_BY_ID[r.branchId].name} · ${r.qty} on hand · min ${MEDICINE_BY_ID[r.medicineId].minStock}`, tone: 'warning' })} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Expiry alerts" subtitle="Batches expiring within 90 days" action={<Button component={RouterLink} to="/owner/inventory" size="small">Inventory</Button>}>
            <AlertList rows={expRows.slice(0, 6)} empty="No batches expiring soon." render={(r) => ({ title: MEDICINE_BY_ID[r.medicineId].name, sub: `${BRANCH_BY_ID[r.branchId].name} · batch ${r.batchNo} · expires ${fmtDay(r.expiry)}`, tone: 'danger' })} />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Panel title="Recent business activity" subtitle="Sales, stock and purchasing events in this session">
            <Grid container spacing={1.5}>
              {activity.map((a) => (
                <Grid key={a.id} size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F8FAFC', border: `1px solid ${palette.border}`, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 8, height: 8, mt: 0.9, borderRadius: '50%', bgcolor: a.tone === 'danger' ? palette.danger : a.tone === 'warning' ? palette.warning : a.tone === 'info' ? palette.blue : palette.success, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{a.text}</Typography>
                      <Typography variant="caption" color="text.secondary">{fmtDateTime(a.at)}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Panel>
        </Grid>
      </Grid>
    </>
  )
}

function CompareRow({ label, cur, prev, curLabel, prevLabel }) {
  const d = pct(cur, prev)
  const up = d >= 0
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Chip size="small" label={deltaLabel(d)} sx={{ bgcolor: up ? palette.successSoft : palette.dangerSoft, color: up ? palette.success : palette.danger, fontWeight: 700 }} />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{curLabel}</Typography>
          <Typography fontWeight={700}>{formatPKR(cur)}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{prevLabel}</Typography>
          <Typography fontWeight={600} color="text.secondary">{formatPKR(prev)}</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function PaymentMix({ s }) {
  const total = s.cash + s.card + s.wallet + s.bank || 1
  const rows = [
    ['Cash', s.cash, palette.success],
    ['Card', s.card, palette.blue],
    ['Mobile wallet', s.wallet, palette.teal],
    ['Bank transfer', s.bank, palette.warning],
  ]
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {rows.map(([name, v, c]) => (
        <Box key={name}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="caption">{name}</Typography>
            <Typography variant="caption" fontWeight={600}>{formatCompactPKR(v)} · {Math.round((v / total) * 100)}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={(v / total) * 100} sx={{ height: 5, borderRadius: 3, bgcolor: '#EEF2F8', '& .MuiLinearProgress-bar': { bgcolor: c } }} />
        </Box>
      ))}
    </Stack>
  )
}

function AlertList({ rows, empty, render }) {
  if (rows.length === 0) return <Typography variant="body2" color="text.secondary">{empty}</Typography>
  return (
    <Stack spacing={1}>
      {rows.map((r) => {
        const a = render(r)
        return (
          <Stack key={r.id} direction="row" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${palette.border}`, alignItems: 'center' }}>
            <Avatar variant="rounded" sx={{ width: 34, height: 34, bgcolor: a.tone === 'danger' ? palette.dangerSoft : palette.warningSoft, color: a.tone === 'danger' ? palette.danger : palette.warning, fontSize: 13 }}>
              {MEDICINE_BY_ID[r.medicineId].name.slice(0, 1)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">{a.sub}</Typography>
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )
}
