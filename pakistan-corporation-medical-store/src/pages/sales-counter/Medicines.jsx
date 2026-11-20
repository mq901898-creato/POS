import { useMemo, useState } from 'react'
import { Box, Button, Chip, Drawer, IconButton, InputAdornment, Stack, TextField, Typography, Card, Divider } from '@mui/material'
import { Search, X, PackagePlus, ScanBarcode } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatusChip from '../../components/common/StatusChip'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, CATEGORIES, CATEGORY_COLORS, ANCHOR, toDayKey } from '../../data/demoData'
import { availableUnits, inventoryStatus } from '../../utils/analytics'
import { daysFromAnchor, fmtDay, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function MedicineCatalogue() {
  const { state, session } = useDemo()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState('All')
  const [openId, setOpenId] = useState(null)
  const [availOnly, setAvailOnly] = useState(false)

  const list = useMemo(() => state.medicines.map((m) => ({
    ...m,
    avail: availableUnits(state.inventory, session.branchId, m.id),
    batches: state.inventory.filter((r) => r.branchId === session.branchId && r.medicineId === m.id && r.qty > 0).sort((a, b) => (a.expiry < b.expiry ? -1 : 1)),
  })).filter((m) => {
    if (category !== 'All' && m.category !== category) return false
    if (availOnly && m.avail <= 0) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${m.name} ${m.generic} ${m.barcode} ${m.manufacturer}`.toLowerCase().includes(q)
  }), [state.medicines, state.inventory, session.branchId, category, query, availOnly])

  const open = list.find((m) => m.id === openId) || state.medicines.find((m) => m.id === openId)
  const openBatches = open ? state.inventory.filter((r) => r.branchId === session.branchId && r.medicineId === open.id) : []

  return (
    <>
      <PageHeader
        breadcrumbs={['Sales counter', 'Counter', 'Medicine catalogue']}
        title="Medicine catalogue"
        subtitle={`${BRANCH_BY_ID[session.branchId].name} · stock shown is held at this branch only`}
      />

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            fullWidth size="small" placeholder="Search by name, generic, manufacturer or barcode…" value={query} onChange={(e) => setQuery(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color={palette.textMuted} /></InputAdornment> } }}
          />
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: 'center' }}>
            <Chip size="small" icon={<ScanBarcode size={13} />} label={`${list.length} products`} variant="outlined" />
            <Chip size="small" label={availOnly ? 'In stock only ✓' : 'In stock only'} onClick={() => setAvailOnly((v) => !v)} color={availOnly ? 'primary' : 'default'} variant={availOnly ? 'filled' : 'outlined'} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map((c) => (
            <Chip key={c} size="small" label={c} onClick={() => setCategory(c)} color={category === c ? 'primary' : 'default'} variant={category === c ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
          ))}
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
        {list.map((m) => {
          const color = CATEGORY_COLORS[m.category]
          const near = m.batches[0]
          const days = near ? daysFromAnchor(near.expiry) : null
          return (
            <Card key={m.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', opacity: m.avail ? 1 : 0.7 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ width: 52, height: 52, borderRadius: 2.5, flexShrink: 0, background: `linear-gradient(135deg, ${color}22, ${color}44)`, color, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20 }}>
                  {m.name.slice(0, 1)}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block',  lineHeight: 1.3 }}>{m.generic}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{m.manufacturer}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.pack}</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Sale price</Typography>
                  <Typography fontWeight={700} sx={{ fontSize: 17, color: palette.navy }}>{formatPKR(m.salePrice)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Available here</Typography>
                  <Typography fontWeight={700} color={m.avail <= 0 ? 'error.main' : m.avail < m.minStock ? 'warning.dark' : 'success.dark'}>{m.avail} units</Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: '#F6F8FB', fontSize: 12.5 }}>
                {near ? (
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <span>Batch <strong>{near.batchNo}</strong></span>
                    <span style={{ color: days <= 90 ? palette.warning : palette.textMuted }}>Exp {fmtDay(near.expiry)}</span>
                  </Stack>
                ) : <Typography variant="caption" color="error.main">No sellable batch at this branch</Typography>}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => setOpenId(m.id)} sx={{ flex: 1, color: 'text.primary', borderColor: palette.border, whiteSpace: 'nowrap' }}>Details</Button>
                <Button size="small" variant="contained" disabled={m.avail <= 0} startIcon={<PackagePlus size={14} />} onClick={() => navigate(`/sales/new-order?add=${m.id}`)} sx={{ flex: 1.4, whiteSpace: 'nowrap' }}>Add</Button>
              </Stack>
            </Card>
          )
        })}
        {list.length === 0 && <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 6 }}>No medicines match these filters.</Typography>}
      </Box>

      <Drawer anchor="right" open={!!openId} onClose={() => setOpenId(null)} slotProps={{ paper: { sx: { width: { xs: '100%', md: 460 } } } }}>
        {open && (
          <Box>
            <Stack direction="row" sx={{ p: 2.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="overline" color="text.secondary">{open.category}</Typography>
                <Typography variant="h2">{open.name}</Typography>
                <Typography variant="body2" color="text.secondary">{open.generic}</Typography>
              </Box>
              <IconButton onClick={() => setOpenId(null)} aria-label="Close drawer"><X size={18} /></IconButton>
            </Stack>
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={1.25} sx={{ mb: 2.5, fontSize: 13.5 }}>
                <Line k="Manufacturer" v={open.manufacturer} />
                <Line k="Form · pack" v={`${open.form} · ${open.pack}`} />
                <Line k="Barcode" v={open.barcode} />
                <Line k="Sale price" v={formatPKR(open.salePrice)} />
              </Stack>
              <Typography variant="h3" sx={{ mb: 1 }}>Batches at {BRANCH_BY_ID[session.branchId].code}</Typography>
              <Stack spacing={1}>
                {openBatches.length === 0 && <Typography variant="body2" color="text.secondary">No stock recorded at this branch.</Typography>}
                {openBatches.map((r) => (
                  <Stack key={r.id} direction="row" sx={{ p: 1.25, border: `1px solid ${palette.border}`, borderRadius: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Batch {r.batchNo}</Typography>
                      <Typography variant="caption" color="text.secondary">Expires {fmtDay(r.expiry)} · {r.qty} units</Typography>
                    </Box>
                    <StatusChip status={inventoryStatus(r)} />
                  </Stack>
                ))}
              </Stack>
              <Button fullWidth variant="contained" sx={{ mt: 3 }} startIcon={<PackagePlus size={15} />} onClick={() => navigate(`/sales/new-order?add=${open.id}`)} disabled={!open.id || !availableUnits(state.inventory, session.branchId, open.id)}>
                Add to new order
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block',  mt: 2 }}>Demo catalogue · {toDayKey(ANCHOR)}</Typography>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  )
}

function Line({ k, v }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">{k}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>{v}</Typography>
    </Stack>
  )
}
