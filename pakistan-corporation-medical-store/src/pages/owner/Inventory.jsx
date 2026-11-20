import { useMemo, useState } from 'react'
import { Box, Button, Chip, Drawer, Grid, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Typography, Divider } from '@mui/material'
import { Plus, Pencil, Trash2, SlidersHorizontal, Eye, X, Download } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import StatusChip from '../../components/common/StatusChip'
import Panel from '../../components/common/Panel'
import DataTable from '../../components/tables/DataTable'
import ActionMenu from '../../components/tables/ActionMenu'
import MedicineFormDialog from '../../components/modals/MedicineFormDialog'
import StockAdjustDialog from '../../components/modals/StockAdjustDialog'
import ConfirmDialog from '../../components/modals/ConfirmDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, BRANCH_BY_ID, CATEGORIES, MEDICINE_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { inventoryStatus, isExpiringSoon, isLowStock, isExpired } from '../../utils/analytics'
import { daysFromAnchor, fmtDay, formatPKR, formatNumber } from '../../utils/format'
import { palette } from '../../styles/theme'

const STATUS_FILTERS = ['All statuses', 'Low Stock', 'Expiring Soon', 'Expired', 'Out of Stock']

export default function Inventory() {
  const { state, dispatch, notify, session } = useDemo()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('stock')
  const [branch, setBranch] = useState(session.branchId && session.branchId !== 'all' ? session.branchId : 'all')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState(params.get('filter') === 'low' ? 'Low Stock' : params.get('filter') === 'expiring' ? 'Expiring Soon' : 'All statuses')
  const [formOpen, setFormOpen] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const [adjust, setAdjust] = useState(null)
  const [drawerMed, setDrawerMed] = useState(null)
  const [deleteMed, setDeleteMed] = useState(null)
  const [focus] = useState(params.get('q') || '')

  const barcodes = useMemo(() => state.medicines.map((m) => m.barcode), [state.medicines])

  const stockRows = useMemo(() => state.inventory
    .filter((r) => (branch === 'all' || r.branchId === branch))
    .filter((r) => category === 'All categories' || MEDICINE_BY_ID[r.medicineId]?.category === category)
    .map((r) => {
      const med = MEDICINE_BY_ID[r.medicineId]
      return { ...r, med, st: inventoryStatus(r), days: daysFromAnchor(r.expiry) }
    })
    .filter((r) => {
      if (!r.med) return false
      if (status === 'All statuses') return true
      if (status === 'Low Stock') return isLowStock(r)
      if (status === 'Expiring Soon') return isExpiringSoon(r)
      if (status === 'Expired') return isExpired(r)
      if (status === 'Out of Stock') return r.qty === 0
      return true
    }), [state.inventory, branch, category, status])

  const summary = useMemo(() => {
    const rows = state.inventory.filter((r) => branch === 'all' || r.branchId === branch)
    return {
      skus: rows.length,
      units: rows.reduce((s, r) => s + r.qty, 0),
      value: rows.reduce((s, r) => s + r.qty * (MEDICINE_BY_ID[r.medicineId]?.purchasePrice || 0), 0),
      low: rows.filter(isLowStock).length,
      expiring: rows.filter(isExpiringSoon).length,
    }
  }, [state.inventory, branch])

  const catalogueRows = useMemo(() => state.medicines
    .filter((m) => category === 'All categories' || m.category === category)
    .map((m) => {
      const batches = state.inventory.filter((r) => r.medicineId === m.id && (branch === 'all' || r.branchId === branch))
      return { ...m, stock: batches.reduce((s, r) => s + r.qty, 0), branches: new Set(batches.filter((r) => r.qty > 0).map((r) => r.branchId)).size }
    }), [state.medicines, state.inventory, category, branch])

  const saveMedicine = ({ medicine, stock, isEdit }) => {
    if (isEdit) {
      dispatch({ type: 'UPDATE_MEDICINE', medicine })
      notify(`${medicine.name} updated across all branches`)
    } else {
      dispatch({ type: 'ADD_MEDICINE', medicine, stock })
      notify(`${medicine.name} added${stock ? ` with ${stock.qty} units at ${BRANCH_BY_ID[stock.branchId].name}` : ''}`)
    }
    setFormOpen(false)
    setEditMed(null)
  }

  const clearFilter = () => { setParams({}); setStatus('All statuses') }

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Operations', 'Inventory']}
        title="Inventory management"
        subtitle="Stock is held per branch and per batch. Adjustments are logged with a reason."
        actions={
          <>
            <Button variant="outlined" color="inherit" startIcon={<Download size={15} />} onClick={() => notify('Inventory export queued (demo simulation)', 'info')} sx={{ color: 'text.primary', borderColor: 'divider' }}>Export</Button>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditMed(null); setFormOpen(true) }}>Add medicine</Button>
          </>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 2.4 }}><KpiCard label="Batches" value={formatNumber(summary.skus)} tone="blue" icon={SlidersHorizontal} /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><KpiCard label="Units on hand" value={formatNumber(summary.units)} tone="teal" icon={SlidersHorizontal} /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><KpiCard label="Stock value (cost)" value={formatPKR(summary.value)} tone="navy" icon={SlidersHorizontal} /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><KpiCard label="Low stock batches" value={summary.low} tone="amber" icon={SlidersHorizontal} /></Grid>
        <Grid size={{ xs: 12, md: 2.4 }}><KpiCard label="Expiring in 90 days" value={summary.expiring} tone="red" icon={SlidersHorizontal} /></Grid>
      </Grid>

      <Panel noPad contentSx={{ p: 0 }}>
        <Box sx={{ px: 2, borderBottom: `1px solid ${palette.border}` }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 46 }}>
            <Tab value="stock" label="Stock by batch" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="catalogue" label="Medicine catalogue" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { md: 'center' } }}>
            <TextField select size="small" label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="all">All branches</MenuItem>
              {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 190 }}>
              <MenuItem value="All categories">All categories</MenuItem>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            {tab === 'stock' && (
              <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
                {STATUS_FILTERS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            )}
            {(params.get('filter') || status !== 'All statuses') && (
              <Chip size="small" onDelete={clearFilter} label={`Filter: ${status}`} color="primary" variant="outlined" />
            )}
          </Stack>

          {tab === 'stock' ? (
            <DataTable
              rowsPerPage={8}
              searchFields={(r) => [r.med.name, r.med.generic, r.batchNo, r.med.barcode, r.med.manufacturer, BRANCH_BY_ID[r.branchId].name]}
              searchPlaceholder="Search medicine, batch, barcode…"
              defaultSort={{ id: 'expiry', dir: 'asc' }}
              columns={[
                {
                  id: 'name', label: 'Medicine', sortValue: (r) => r.med.name,
                  render: (r) => (
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{r.med.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.med.generic}</Typography>
                    </Box>
                  ),
                },
                { id: 'cat', label: 'Category', render: (r) => <Chip size="small" variant="outlined" label={r.med.category} />, sortable: false },
                { id: 'branch', label: 'Branch', render: (r) => BRANCH_BY_ID[r.branchId].name, sortValue: (r) => BRANCH_BY_ID[r.branchId].name },
                { id: 'batch', label: 'Batch no.', render: (r) => <Typography variant="caption" fontFamily="monospace">{r.batchNo}</Typography> },
                {
                  id: 'expiry', label: 'Expiry', sortValue: (r) => r.expiry,
                  render: (r) => (
                    <Box>
                      <Typography variant="body2">{fmtDay(r.expiry)}</Typography>
                      <Typography variant="caption" color={r.days < 0 ? 'error.main' : r.days <= 90 ? 'warning.dark' : 'text.secondary'}>
                        {r.days < 0 ? `Expired ${Math.abs(r.days)} days ago` : `${r.days} days left`}
                      </Typography>
                    </Box>
                  ),
                },
                { id: 'qty', label: 'Qty', align: 'right', render: (r) => <Typography fontWeight={600} color={isLowStock(r) ? 'warning.dark' : 'text.primary'}>{r.qty}</Typography> },
                { id: 'min', label: 'Min', align: 'right', render: (r) => r.med.minStock, sortable: false },
                { id: 'price', label: 'Sale price', align: 'right', render: (r) => formatPKR(r.med.salePrice), sortValue: (r) => r.med.salePrice },
                { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.st} />, sortable: false },
                {
                  id: 'actions', label: '', sortable: false, align: 'right',
                  render: (r) => (
                    <ActionMenu
                      items={[
                        { label: 'Adjust stock', icon: SlidersHorizontal, onClick: () => setAdjust(r) },
                        { label: 'Stock details', icon: Eye, onClick: () => setDrawerMed(r.medicineId) },
                        { label: 'Edit medicine', icon: Pencil, onClick: () => { setEditMed(r.med); setFormOpen(true) } },
                      ]}
                    />
                  ),
                },
              ]}
              rows={stockRows}
            />
          ) : (
            <DataTable
              rowsPerPage={8}
              searchFields={(m) => [m.name, m.generic, m.barcode, m.manufacturer, m.category]}
              searchPlaceholder="Search by name, generic, barcode…"
              columns={[
                {
                  id: 'name', label: 'Brand / generic', sortValue: (m) => m.name,
                  render: (m) => (
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.generic} · {m.form} · {m.pack}</Typography>
                    </Box>
                  ),
                },
                { id: 'manufacturer', label: 'Manufacturer' },
                { id: 'barcode', label: 'Barcode', render: (m) => <Typography variant="caption" fontFamily="monospace">{m.barcode}</Typography>, sortable: false },
                { id: 'purchasePrice', label: 'Purchase', align: 'right', render: (m) => formatPKR(m.purchasePrice), sortValue: (m) => m.purchasePrice },
                { id: 'salePrice', label: 'Sale', align: 'right', render: (m) => formatPKR(m.salePrice), sortValue: (m) => m.salePrice },
                { id: 'minStock', label: 'Min / branch', align: 'right', sortable: false, render: (m) => m.minStock },
                { id: 'stock', label: 'Stock (selected)', align: 'right', render: (m) => <Typography fontWeight={600}>{m.stock}</Typography>, sortValue: (m) => m.stock },
                { id: 'branches', label: 'Branches stocked', align: 'right', render: (m) => m.branches, sortable: false },
                {
                  id: 'actions', label: '', sortable: false, align: 'right',
                  render: (m) => (
                    <ActionMenu
                      items={[
                        { label: 'Stock details', icon: Eye, onClick: () => setDrawerMed(m.id) },
                        { label: 'Edit medicine', icon: Pencil, onClick: () => { setEditMed(m); setFormOpen(true) } },
                        { divider: true },
                        { label: 'Delete medicine', icon: Trash2, danger: true, onClick: () => setDeleteMed(m) },
                      ]}
                    />
                  ),
                },
              ]}
              rows={catalogueRows}
            />
          )}
        </Box>
      </Panel>

      <MedicineFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMed(null) }}
        medicine={editMed}
        existingBarcodes={barcodes}
        onSubmit={saveMedicine}
      />

      <StockAdjustDialog
        open={!!adjust}
        onClose={() => setAdjust(null)}
        row={adjust}
        medicine={adjust ? MEDICINE_BY_ID[adjust.medicineId] : null}
        onSubmit={({ inventoryId, delta, reason }) => {
          dispatch({ type: 'ADJUST_STOCK', inventoryId, delta, reason })
          notify(`Stock ${delta >= 0 ? 'increased' : 'reduced'} by ${Math.abs(delta)} · ${reason}`, delta >= 0 ? 'success' : 'warning')
          setAdjust(null)
        }}
      />

      <ConfirmDialog
        open={!!deleteMed}
        onClose={() => setDeleteMed(null)}
        danger
        title={`Delete ${deleteMed?.name}?`}
        text="This removes the medicine from the catalogue and clears its stock at all five branches. This demo action cannot be undone except by resetting demo data."
        confirmLabel="Delete medicine"
        onConfirm={() => {
          dispatch({ type: 'DELETE_MEDICINE', id: deleteMed.id })
          notify(`${deleteMed.name} removed from catalogue`, 'warning')
          setDeleteMed(null)
        }}
      />

      <Drawer anchor="right" open={!!drawerMed} onClose={() => setDrawerMed(null)} slotProps={{ paper: { sx: { width: { xs: '100%', md: 680 } } } }}>
        {drawerMed && <StockDetails medicineId={drawerMed} onClose={() => setDrawerMed(null)} />}
      </Drawer>
      {focus && null}
    </>
  )
}

function StockDetails({ medicineId, onClose }) {
  const { state } = useDemo()
  const m = MEDICINE_BY_ID[medicineId] || state.medicines.find((x) => x.id === medicineId)
  const rows = state.inventory.filter((r) => r.medicineId === medicineId)
  const ids = new Set(rows.map((r) => r.id))
  const log = state.adjustments.filter((a) => ids.has(a.inventoryId)).slice(0, 8)
  if (!m) return null
  const total = rows.reduce((s, r) => s + r.qty, 0)
  return (
    <Box>
      <Stack direction="row" sx={{ p: 2.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="overline" color="text.secondary">{m.category} · {m.form}</Typography>
          <Typography variant="h2">{m.name}</Typography>
          <Typography variant="body2" color="text.secondary">{m.generic}</Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close drawer"><X size={18} /></IconButton>
      </Stack>
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {[
            ['Manufacturer', m.manufacturer], ['Barcode', m.barcode], ['Pack', m.pack],
            ['Purchase price', formatPKR(m.purchasePrice)], ['Sale price', formatPKR(m.salePrice)], ['Min stock / branch', m.minStock],
            ['Total units (all branches)', formatNumber(total)], ['Stock value (cost)', formatPKR(total * m.purchasePrice)],
          ].map(([k, v]) => (
            <Grid key={k} size={{ xs: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{k}</Typography>
              <Typography variant="body2" fontWeight={600}>{v}</Typography>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h3" sx={{ mb: 1 }}>Stock by branch</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block',  mb: 1 }}>Each branch holds its own quantities. Nothing is pooled automatically.</Typography>
        <Box sx={{ border: `1px solid ${palette.border}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
          {BRANCHES.map((b) => {
            const br = rows.filter((r) => r.branchId === b.id)
            const q = br.reduce((s, r) => s + r.qty, 0)
            const next = br.sort((a, c) => (a.expiry < c.expiry ? -1 : 1))[0]
            return (
              <Stack key={b.id} direction="row" sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${palette.border}`, '&:last-child': { borderBottom: 0 }, justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{next ? `Nearest expiry ${fmtDay(next.expiry)} · batch ${next.batchNo}` : 'No batches'}</Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Typography fontWeight={700}>{q} units</Typography>
                  {next && <StatusChip status={inventoryStatus({ ...next, qty: q })} />}
                </Stack>
              </Stack>
            )
          })}
        </Box>

        <Typography variant="h3" sx={{ mb: 1 }}>Adjustment history</Typography>
        {log.length === 0 && <Typography variant="body2" color="text.secondary">No stock adjustments recorded for this medicine.</Typography>}
        <Stack spacing={1}>
          {log.map((a) => (
            <Stack key={a.id} direction="row" sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F8FAFC', border: `1px solid ${palette.border}`, justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{a.reason}</Typography>
                <Typography variant="caption" color="text.secondary">{fmtDay(a.date)} · {BRANCH_BY_ID[state.inventory.find((r) => r.id === a.inventoryId)?.branchId]?.name}</Typography>
              </Box>
              <Typography fontWeight={700} color={a.delta >= 0 ? 'success.main' : 'error.main'}>{a.delta >= 0 ? '+' : ''}{a.delta}</Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Typography variant="caption" color="text.secondary">Figures are demonstration data. Demo date: {fmtDay(toDayKey(ANCHOR))}.</Typography>
      </Box>
    </Box>
  )
}
