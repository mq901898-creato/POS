import { useMemo, useState } from 'react'
import { Box, Button, Chip, Grid, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import { CompareBarChart, ShareDonut, TrendChart } from '../../components/charts/Charts'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, BRANCH_BY_ID, MONTHLY_ARCHIVE, ANCHOR, toDayKey, addDays } from '../../data/demoData'
import { filterSales, summarize, monthLabel, localKey } from '../../utils/analytics'
import { formatPKR, formatCompactPKR, fmtDay, fmtTime } from '../../utils/format'
import { palette } from '../../styles/theme'

const DETAIL_START = '2026-09-01'
const pad = (n) => String(n).padStart(2, '0')
const shiftKey = (key, n) => toDayKey(addDays(new Date(...key.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))), n))

function rangeFor(period, dateKey, monthKey) {
  if (period === 'daily') return { from: dateKey, to: dateKey }
  if (period === 'weekly') return { from: shiftKey(dateKey, -6), to: dateKey }
  if (period === 'monthly') {
    const [y, m] = monthKey.split('-').map(Number)
    return { from: `${monthKey}-01`, to: `${monthKey}-${pad(new Date(y, m, 0).getDate())}` }
  }
  return { from: '2026-01-01', to: '2026-12-31' }
}

/**
 * Period summary that blends archived monthly totals (Jan–Aug) with detailed invoices (from 1 Sep).
 */
function periodSummary(allSales, branchId, range) {
  const out = { gross: 0, refunds: 0, net: 0, profit: 0, count: 0, cash: 0, card: 0, wallet: 0, bank: 0, refundCount: 0, avgTicket: 0 }
  const archiveFrom = range.from
  if (archiveFrom < DETAIL_START) {
    MONTHLY_ARCHIVE.forEach((r) => {
      const mk = r.month
      const monthFrom = `${mk}-01`
      const monthTo = `${mk}-31`
      if (monthTo < range.from || monthFrom > range.to) return
      if (branchId !== 'all' && r.branchId !== branchId) return
      out.gross += r.sales
      out.refunds += r.refunds
      out.profit += r.profit
      out.count += r.orders
      out.cash += r.cash
      out.card += r.card
      out.wallet += r.online
      out.bank += r.bank
    })
  }
  const detFrom = range.from > DETAIL_START ? range.from : DETAIL_START
  if (detFrom <= range.to) {
    const s = summarize(filterSales(allSales, { branchId, from: detFrom, to: range.to }))
    out.gross += s.gross
    out.refunds += s.refunds
    out.profit += s.profit
    out.count += s.count
    out.cash += s.cash
    out.card += s.card
    out.wallet += s.wallet
    out.bank += s.bank
    out.refundCount += s.refundCount
  }
  out.net = out.gross - out.refunds
  out.online = out.wallet + out.bank
  out.avgTicket = out.count ? out.gross / out.count : 0
  return out
}

export default function SalesReports() {
  const { allSales, session, notify } = useDemo()
  const [period, setPeriod] = useState('daily')
  const [branch, setBranch] = useState(session.branchId || 'all')
  const [dateKey, setDateKey] = useState(toDayKey(ANCHOR))
  const [monthKey, setMonthKey] = useState('2026-11')

  const range = useMemo(() => rangeFor(period, dateKey, monthKey), [period, dateKey, monthKey])
  const prevRange = useMemo(() => {
    if (period === 'daily') return { from: shiftKey(range.from, -1), to: shiftKey(range.to, -1) }
    if (period === 'weekly') return { from: shiftKey(range.from, -7), to: shiftKey(range.to, -7) }
    if (period === 'monthly') {
      const [y, m] = monthKey.split('-').map(Number)
      const pm = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`
      return rangeFor('monthly', dateKey, pm)
    }
    return null
  }, [period, range, monthKey, dateKey])

  const cur = useMemo(() => periodSummary(allSales, branch, range), [allSales, branch, range])
  const prev = useMemo(() => (prevRange ? periodSummary(allSales, branch, prevRange) : null), [allSales, branch, prevRange])
  const delta = (a, b) => (b ? `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)}% vs prior` : 'No prior period')

  const invoices = useMemo(() => filterSales(allSales, { branchId: branch, from: range.from, to: range.to }), [allSales, branch, range])
  const branchRows = useMemo(() => BRANCHES.map((b) => ({ id: b.id, branch: b, ...periodSummary(allSales, b.id, range) })), [allSales, range])
  const refunded = invoices.filter((s) => s.status === 'Refunded')

  // charts
  const hourly = useMemo(() => {
    if (period !== 'daily' || range.from < DETAIL_START) return []
    const buckets = Array.from({ length: 13 }, (_, i) => ({ label: `${9 + i}:00`, gross: 0, net: 0 }))
    invoices.forEach((s) => {
      const h = new Date(s.createdAt).getHours() - 9
      if (h >= 0 && h < buckets.length) {
        buckets[h].gross += s.total
        buckets[h].net += s.status === 'Completed' ? s.total : 0
      }
    })
    return buckets.map((b) => ({ ...b, gross: Math.round(b.gross), net: Math.round(b.net) }))
  }, [invoices, period, range])

  const days = useMemo(() => {
    if (period === 'yearly' || range.from < DETAIL_START) return []
    const out = []
    let d = range.from
    while (d <= range.to) {
      const list = filterSales(allSales, { branchId: branch, from: d, to: d })
      const s = summarize(list)
      out.push({ id: d, key: d, label: fmtDay(d).slice(0, 6), date: d, count: s.count, gross: Math.round(s.gross), refunds: Math.round(s.refunds), net: Math.round(s.net), profit: Math.round(s.profit) })
      d = shiftKey(d, 1)
      if (out.length > 62) break
    }
    return out
  }, [allSales, branch, range, period])

  const months = useMemo(() => {
    if (period !== 'yearly') return []
    return Array.from({ length: 11 }, (_, i) => {
      const mk = `2026-${pad(i + 1)}`
      const s = periodSummary(allSales, branch, { from: `${mk}-01`, to: `${mk}-31` })
      return { id: mk, month: mk, label: monthLabel(mk), gross: Math.round(s.gross), refunds: Math.round(s.refunds), net: Math.round(s.net), profit: Math.round(s.profit), count: s.count }
    })
  }, [allSales, branch, period])

  const periodTitle = { daily: 'Daily sales report', weekly: 'Weekly sales report', monthly: 'Monthly sales report', yearly: 'Yearly sales report 2026' }[period]
  const rangeLabel = period === 'yearly' ? 'Jan – Dec 2026 (year to date)' : `${fmtDay(range.from)} – ${fmtDay(range.to)}`
  const scopeName = branch === 'all' ? 'All branches' : BRANCH_BY_ID[branch].name

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Finance', 'Sales reports']}
        title="Sales & financial reports"
        subtitle={`${periodTitle} · ${scopeName} · ${rangeLabel}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" startIcon={<FileText size={15} />} onClick={() => notify('PDF export queued (demo simulation)', 'info')} sx={{ color: 'text.primary', borderColor: 'divider' }}>PDF</Button>
            <Button variant="outlined" color="inherit" startIcon={<FileSpreadsheet size={15} />} onClick={() => notify('Excel export queued (demo simulation)', 'info')} sx={{ color: 'text.primary', borderColor: 'divider' }}>Excel</Button>
            <Button variant="outlined" color="inherit" startIcon={<Download size={15} />} onClick={() => notify('CSV export queued (demo simulation)', 'info')} sx={{ color: 'text.primary', borderColor: 'divider' }}>CSV</Button>
            <Button variant="contained" startIcon={<Printer size={15} />} onClick={() => window.print()}>Print</Button>
          </>
        }
      />

      <Panel sx={{ mb: 2.5 }} contentSx={{ py: 1.5 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <ToggleButtonGroup exclusive size="small" value={period} onChange={(_, v) => v && setPeriod(v)}>
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {period === 'monthly' ? (
              <TextField select size="small" label="Month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} sx={{ minWidth: 160 }}>
                {Array.from({ length: 11 }, (_, i) => `2026-${pad(i + 1)}`).map((m) => <MenuItem key={m} value={m}>{monthLabel(m)}</MenuItem>)}
              </TextField>
            ) : period === 'yearly' ? null : (
              <TextField size="small" type="date" label={period === 'weekly' ? 'Week ending' : 'Date'} value={dateKey} onChange={(e) => setDateKey(e.target.value || dateKey)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 170 }} />
            )}
            <TextField select size="small" label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="all">All branches (consolidated)</MenuItem>
              {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
          </Stack>
        </Stack>
      </Panel>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2.5 }}>
        <KpiCard label="Gross sales" value={formatPKR(cur.gross)} hint={prev ? delta(cur.gross, prev.gross) : `${cur.count} invoices`} icon={FileText} tone="blue" />
        <KpiCard label="Refunds" value={formatPKR(cur.refunds)} hint={`${cur.refundCount || 0} refunded invoices`} tone="red" icon={FileText} />
        <KpiCard label="Net revenue" value={formatPKR(cur.net)} hint={prev ? delta(cur.net, prev.net) : 'After refunds'} tone="navy" icon={FileText} />
        <KpiCard label="Estimated profit" value={formatPKR(cur.profit)} hint={prev ? delta(cur.profit, prev.profit) : `${cur.gross ? ((cur.profit / cur.gross) * 100).toFixed(1) : 0}% margin`} tone="green" icon={FileText} />
        <KpiCard label="Cash sales" value={formatPKR(cur.cash)} hint={`${cur.gross ? Math.round((cur.cash / cur.gross) * 100) : 0}% of gross`} tone="teal" icon={FileText} />
        <KpiCard label="Card sales" value={formatPKR(cur.card)} hint={`${cur.gross ? Math.round((cur.card / cur.gross) * 100) : 0}% of gross`} tone="blue" icon={FileText} />
        <KpiCard label="Online payments" value={formatPKR(cur.online)} hint={`Wallet ${formatCompactPKR(cur.wallet)} · Bank ${formatCompactPKR(cur.bank)}`} tone="amber" icon={FileText} />
        <KpiCard label="Average ticket" value={formatPKR(cur.avgTicket)} hint={`${cur.count} invoices`} tone="navy" icon={FileText} />
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Panel title={period === 'yearly' ? 'Monthly sales · 2026' : period === 'daily' ? 'Sales by hour' : 'Daily sales trend'} subtitle={period === 'yearly' ? 'Gross and net by month (Jan–Aug from archive, Sep onward detailed)' : period === 'daily' ? 'Invoice value by hour of trading' : 'Gross and net sales per day'}>
            {period === 'yearly' ? (
              <CompareBarChart data={months.map((m) => ({ label: m.label.replace(' 2026', ''), gross: m.gross, net: m.net }))} series={[{ key: 'gross', label: 'Gross', color: palette.blue }, { key: 'net', label: 'Net', color: palette.teal }]} height={300} />
            ) : period === 'daily' ? (
              range.from < DETAIL_START ? <Typography color="text.secondary">Hourly detail is not available for archived periods.</Typography> : <CompareBarChart data={hourly} series={[{ key: 'gross', label: 'Gross', color: palette.blue }, { key: 'net', label: 'Net', color: palette.teal }]} height={300} />
            ) : days.length ? (
              <TrendChart data={days} xKey="label" series={[{ key: 'gross', label: 'Gross', color: palette.blue }, { key: 'net', label: 'Net', color: palette.teal }]} height={300} />
            ) : (
              <Typography color="text.secondary">Daily detail is not available for archived periods (before 1 Sep 2026).</Typography>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Payment mix" subtitle={rangeLabel}>
            <ShareDonut data={[{ name: 'Cash', value: cur.cash }, { name: 'Card', value: cur.card }, { name: 'Mobile wallet', value: cur.wallet }, { name: 'Bank transfer', value: cur.bank }]} />
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Branch-wise sales" subtitle="Each branch reported separately from its own records" noPad>
            <Box sx={{ p: 2 }}>
              <DataTable
                dense
                rowsPerPage={8}
                columns={[
                  { id: 'name', label: 'Branch', render: (r) => r.branch.name, sortValue: (r) => r.branch.name },
                  { id: 'count', label: 'Invoices', align: 'right', sortValue: (r) => r.count, render: (r) => r.count },
                  { id: 'gross', label: 'Gross', align: 'right', sortValue: (r) => r.gross, render: (r) => formatPKR(r.gross) },
                  { id: 'refunds', label: 'Refunds', align: 'right', sortValue: (r) => r.refunds, render: (r) => formatPKR(r.refunds) },
                  { id: 'net', label: 'Net', align: 'right', sortValue: (r) => r.net, render: (r) => formatPKR(r.net) },
                  { id: 'profit', label: 'Est. profit', align: 'right', sortValue: (r) => r.profit, render: (r) => formatPKR(r.profit) },
                ]}
                rows={branchRows}
              />
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="Sales comparison" subtitle={prev ? `${rangeLabel} against the previous period` : 'Yearly total'}>
            <Stack spacing={1.5}>
              {[
                ['Gross sales', cur.gross, prev?.gross],
                ['Net revenue', cur.net, prev?.net],
                ['Estimated profit', cur.profit, prev?.profit],
                ['Refunds', cur.refunds, prev?.refunds],
              ].map(([label, c, p]) => (
                <Stack key={label} direction="row" sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">Current {formatPKR(c)}{p !== undefined ? ` · Prior ${formatPKR(p)}` : ''}</Typography>
                  </Box>
                  {p !== undefined && p !== null ? (
                    <Chip size="small" label={`${c >= p ? '+' : ''}${p ? (((c - p) / p) * 100).toFixed(1) : '0.0'}%`} sx={{ fontWeight: 700, bgcolor: c >= p ? palette.successSoft : palette.dangerSoft, color: c >= p ? palette.success : palette.danger }} />
                  ) : (
                    <Chip size="small" variant="outlined" label="—" />
                  )}
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Grid>
      </Grid>

      {period !== 'daily' && period !== 'yearly' && (
        <Panel title="Day-by-day breakdown" subtitle="Each calendar day in the selected period" noPad sx={{ mb: 2.5 }}>
          <Box sx={{ p: 2 }}>
            <DataTable
              dense
              rowsPerPage={8}
              columns={[
                { id: 'date', label: 'Date', render: (r) => fmtDay(r.date), sortValue: (r) => r.date },
                { id: 'count', label: 'Invoices', align: 'right' },
                { id: 'gross', label: 'Gross', align: 'right', render: (r) => formatPKR(r.gross) },
                { id: 'refunds', label: 'Refunds', align: 'right', render: (r) => formatPKR(r.refunds) },
                { id: 'net', label: 'Net', align: 'right', render: (r) => formatPKR(r.net) },
                { id: 'profit', label: 'Est. profit', align: 'right', render: (r) => formatPKR(r.profit) },
              ]}
              rows={days}
            />
          </Box>
        </Panel>
      )}

      {period === 'yearly' && (
        <Panel title="Month-by-month · 2026" subtitle="Archived months are summarised; detailed from September" noPad sx={{ mb: 2.5 }}>
          <Box sx={{ p: 2 }}>
            <DataTable
              dense
              rowsPerPage={11}
              columns={[
                { id: 'label', label: 'Month', render: (r) => r.label, sortValue: (r) => r.month },
                { id: 'count', label: 'Invoices / orders', align: 'right', render: (r) => r.count },
                { id: 'gross', label: 'Gross', align: 'right', render: (r) => formatPKR(r.gross) },
                { id: 'refunds', label: 'Refunds', align: 'right', render: (r) => formatPKR(r.refunds) },
                { id: 'net', label: 'Net', align: 'right', render: (r) => formatPKR(r.net) },
                { id: 'profit', label: 'Est. profit', align: 'right', render: (r) => formatPKR(r.profit) },
              ]}
              rows={months}
            />
          </Box>
        </Panel>
      )}

      {period === 'daily' && (
        <Panel title="Invoices" subtitle={`${invoices.length} invoices in this period`} noPad sx={{ mb: 2.5 }}>
          <Box sx={{ p: 2 }}>
            <DataTable
              dense
              rowsPerPage={8}
              searchFields={(s) => [s.id, s.customerName, s.payment, s.cashier]}
              searchPlaceholder="Search invoices…"
              columns={[
                { id: 'id', label: 'Invoice', render: (s) => <Typography variant="caption" fontWeight={600}>{s.id}</Typography> },
                { id: 'time', label: 'Time', render: (s) => fmtTime(s.createdAt), sortValue: (s) => s.createdAt },
                { id: 'branch', label: 'Branch', render: (s) => BRANCH_BY_ID[s.branchId].name, sortable: false },
                { id: 'customer', label: 'Customer', render: (s) => s.customerName },
                { id: 'payment', label: 'Payment', render: (s) => s.payment, sortable: false },
                { id: 'total', label: 'Amount', align: 'right', sortValue: (s) => s.total, render: (s) => formatPKR(s.total) },
                { id: 'status', label: 'Status', render: (s) => <StatusChip status={s.status} />, sortable: false },
              ]}
              rows={invoices}
            />
          </Box>
        </Panel>
      )}

      <Panel title="Refunds" subtitle="Invoices refunded in this period" noPad>
        <Box sx={{ p: 2 }}>
          <DataTable
            dense
            rowsPerPage={5}
            emptyTitle="No refunds in this period"
            emptyText="Refunded invoices appear here with their reasons."
            columns={[
              { id: 'id', label: 'Invoice', render: (s) => <Typography variant="caption" fontWeight={600}>{s.id}</Typography> },
              { id: 'date', label: 'Date', render: (s) => fmtDay(localKey(s.createdAt)) },
              { id: 'branch', label: 'Branch', render: (s) => BRANCH_BY_ID[s.branchId].name, sortable: false },
              { id: 'reason', label: 'Reason', render: (s) => s.refundReason || '—', sortable: false },
              { id: 'amt', label: 'Refunded', align: 'right', sortValue: (s) => s.refundAmount, render: (s) => formatPKR(s.refundAmount) },
            ]}
            rows={refunded}
          />
        </Box>
      </Panel>
    </>
  )
}
