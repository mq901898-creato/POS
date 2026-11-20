import { useMemo, useState } from 'react'
import { Box, Button, Chip, Drawer, Grid, IconButton, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Typography, Divider } from '@mui/material'
import { Store, RefreshCw, X, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import { StatusDot } from '../../components/layout/BranchControl'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, MEDICINE_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { filterSales, summarize, branchInventorySummary, inventoryStatus } from '../../utils/analytics'
import { formatPKR, formatCompactPKR, formatNumber, fmtDay } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function Branches() {
  const { allSales, state, notify } = useDemo()
  const [view, setView] = useState('branch')
  const [openId, setOpenId] = useState(null)
  const today = toDayKey(ANCHOR)

  const metrics = useMemo(() => BRANCHES.map((b) => {
    const t = summarize(filterSales(allSales, { branchId: b.id, from: today, to: today }))
    const mtd = summarize(filterSales(allSales, { branchId: b.id, from: '2026-11-01', to: today }))
    const inv = branchInventorySummary(state.inventory, b.id)
    return { branch: b, today: t, mtd, inv }
  }), [allSales, state.inventory, today])

  const maxMtd = Math.max(...metrics.map((m) => m.mtd.gross))
  const open = metrics.find((m) => m.branch.id === openId)

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Operations', 'Branches']}
        title="Branch management"
        subtitle="Five branches, each with its own stock and sales records. Stock is never combined automatically."
        actions={
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="branch">Branch-wise</ToggleButton>
            <ToggleButton value="consolidated">Consolidated</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {view === 'branch' ? (
        <Grid container spacing={2.5}>
          {metrics.map((m) => {
            const b = m.branch
            return (
              <Grid key={b.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <Panel
                  sx={{ height: '100%', borderTop: `3px solid ${b.status === 'Online' ? palette.success : b.status === 'Syncing' ? palette.warning : palette.danger}` }}
                  title={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Store size={16} color={palette.navy} /> <span>{b.name}</span>
                    </Stack>
                  }
                  subtitle={`${b.city} · Manager: ${b.manager}`}
                  action={<StatusChip status={b.status} />}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ color: 'text.secondary', fontSize: 12.5, alignItems: 'center' }}>
                      <StatusDot status={b.status} />
                      <span>{b.sync}</span>
                    </Stack>
                    <Grid container spacing={1.5}>
                      <Mini label="Today's sales" value={formatPKR(m.today.gross)} />
                      <Mini label="Orders today" value={m.today.count} />
                      <Mini label="Inventory units" value={formatNumber(m.inv.units)} />
                      <Mini label="Stock value (cost)" value={formatCompactPKR(m.inv.value)} />
                      <Mini label="Low-stock batches" value={m.inv.lowStock} tone={m.inv.lowStock ? 'warning' : undefined} />
                      <Mini label="Expiring (90 days)" value={m.inv.expiring} tone={m.inv.expiring ? 'danger' : undefined} />
                    </Grid>
                    <Box>
                      <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Branch performance · MTD</Typography>
                        <Typography variant="caption" fontWeight={700}>{formatCompactPKR(m.mtd.gross)}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(m.mtd.gross / maxMtd) * 100} sx={{ height: 7, borderRadius: 4, bgcolor: '#EEF2F8', '& .MuiLinearProgress-bar': { bgcolor: palette.blue } }} />
                      <Typography variant="caption" color="text.secondary">{Math.round((m.mtd.gross / maxMtd) * 100)}% of top branch · {m.mtd.count} invoices</Typography>
                    </Box>
                    <Button variant="outlined" color="inherit" endIcon={<ArrowRight size={15} />} onClick={() => setOpenId(b.id)} sx={{ color: 'text.primary', borderColor: 'divider' }}>
                      View branch stock &amp; sales
                    </Button>
                  </Stack>
                </Panel>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        <Panel title="Consolidated comparison" subtitle="All branches side by side · November 2026 to date" noPad>
          <Box sx={{ p: 2 }}>
            <DataTable
              rowsPerPage={8}
              columns={[
                { id: 'name', label: 'Branch', render: (r) => <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><StatusDot status={r.branch.status} /><span>{r.branch.name}</span></Stack>, sortValue: (r) => r.branch.name },
                { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.branch.status} />, sortable: false },
                { id: 'today', label: "Today's sales", align: 'right', sortValue: (r) => r.today.gross, render: (r) => formatPKR(r.today.gross) },
                { id: 'orders', label: 'Orders (MTD)', align: 'right', sortValue: (r) => r.mtd.count, render: (r) => r.mtd.count },
                { id: 'mtd', label: 'Gross (MTD)', align: 'right', sortValue: (r) => r.mtd.gross, render: (r) => formatPKR(r.mtd.gross) },
                { id: 'net', label: 'Net (MTD)', align: 'right', sortValue: (r) => r.mtd.net, render: (r) => formatPKR(r.mtd.net) },
                { id: 'profit', label: 'Est. profit', align: 'right', sortValue: (r) => r.mtd.profit, render: (r) => formatPKR(r.mtd.profit) },
                { id: 'units', label: 'Units in stock', align: 'right', sortValue: (r) => r.inv.units, render: (r) => formatNumber(r.inv.units) },
                { id: 'low', label: 'Low stock', align: 'right', sortValue: (r) => r.inv.lowStock, render: (r) => r.inv.lowStock },
                { id: 'exp', label: 'Expiring', align: 'right', sortValue: (r) => r.inv.expiring, render: (r) => r.inv.expiring },
              ]}
              rows={metrics.map((m) => ({ ...m, id: m.branch.id }))}
              emptyTitle="No branches"
            />
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={3} useFlexGap sx={{ fontSize: 13, flexWrap: 'wrap' }}>
              <Total label="Total gross (MTD)" value={formatPKR(metrics.reduce((s, m) => s + m.mtd.gross, 0))} />
              <Total label="Total net (MTD)" value={formatPKR(metrics.reduce((s, m) => s + m.mtd.net, 0))} />
              <Total label="Total units in stock" value={formatNumber(metrics.reduce((s, m) => s + m.inv.units, 0))} />
              <Total label="Total stock value (cost)" value={formatPKR(metrics.reduce((s, m) => s + m.inv.value, 0))} />
            </Stack>
          </Box>
        </Panel>
      )}

      <Panel title="Branch sync status" subtitle="Each branch runs its own local server and database; changes sync to the central ledger." sx={{ mt: 2.5 }} action={<Button size="small" startIcon={<RefreshCw size={14} />} onClick={() => notify('Sync requested for all branches (demo simulation)', 'info')}>Sync now</Button>}>
        <Grid container spacing={1.5}>
          {BRANCHES.map((b) => (
            <Grid key={b.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <Stack direction="row" spacing={1.5} sx={{ p: 1.5, border: `1px solid ${palette.border}`, borderRadius: 2, alignItems: 'center' }}>
                <StatusDot status={b.status} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{b.name} <Typography component="span" variant="caption" color="text.secondary">· {b.status}</Typography></Typography>
                  <Typography variant="caption" color="text.secondary">{b.sync}</Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Panel>

      <Drawer anchor="right" open={!!open} onClose={() => setOpenId(null)} slotProps={{ paper: { sx: { width: { xs: '100%', md: 760 }, p: 0 } } }}>
        {open && <BranchDrawer m={open} inventory={state.inventory} onClose={() => setOpenId(null)} />}
      </Drawer>
    </>
  )
}

function BranchDrawer({ m, inventory, onClose }) {
  const rows = inventory.filter((r) => r.branchId === m.branch.id).map((r) => ({ ...r, med: MEDICINE_BY_ID[r.medicineId], status: inventoryStatus(r) }))
  return (
    <Box>
      <Stack direction="row" sx={{ p: 2.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2">{m.branch.name}</Typography>
          <Typography variant="body2" color="text.secondary">{m.branch.city} · {m.branch.status} · {m.branch.sync}</Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close drawer"><X size={18} /></IconButton>
      </Stack>
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Mini label="Gross (MTD)" value={formatPKR(m.mtd.gross)} />
          <Mini label="Net (MTD)" value={formatPKR(m.mtd.net)} />
          <Mini label="Est. profit (MTD)" value={formatPKR(m.mtd.profit)} />
          <Mini label="Stock batches" value={rows.length} />
        </Grid>
        <Typography variant="h3" sx={{ mb: 1 }}>Branch stock · {m.branch.code}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block',  mb: 1.5 }}>Quantities shown are held at this branch only.</Typography>
        <DataTable
          dense
          rowsPerPage={8}
          searchFields={(r) => [r.med?.name, r.batchNo, r.med?.category]}
          searchPlaceholder="Search this branch's stock…"
          columns={[
            { id: 'name', label: 'Medicine', render: (r) => <Typography variant="body2" fontWeight={600}>{r.med?.name}</Typography>, sortValue: (r) => r.med?.name },
            { id: 'batchNo', label: 'Batch' },
            { id: 'expiry', label: 'Expiry', render: (r) => fmtDay(r.expiry), sortValue: (r) => r.expiry },
            { id: 'qty', label: 'Qty', align: 'right' },
            { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} />, sortable: false },
          ]}
          rows={rows}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip size="small" variant="outlined" label={`${m.inv.lowStock} low stock`} />
          <Chip size="small" variant="outlined" label={`${m.inv.expiring} expiring`} />
          <Chip size="small" variant="outlined" label={`${m.inv.expired} expired`} />
        </Stack>
      </Box>
    </Box>
  )
}

function Mini({ label, value, tone }) {
  const color = tone === 'warning' ? palette.warning : tone === 'danger' ? palette.danger : palette.text
  return (
    <Grid size={{ xs: 6 }}>
      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F6F8FB' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography fontWeight={700} sx={{ color, fontSize: 15 }}>{value}</Typography>
      </Box>
    </Grid>
  )
}

function Total({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  )
}
