import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, Chip, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography, Divider } from '@mui/material'
import { Minus, Plus, Search, Send, ShoppingBasket, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, CATEGORIES, CATEGORY_COLORS, CUSTOMERS, ANCHOR } from '../../data/demoData'
import { availableUnits } from '../../utils/analytics'
import { formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

const nextOrderId = (orders) => {
  const max = orders.reduce((m, o) => {
    const n = parseInt(String(o.id).replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 480)
  return `ORD-${String(max + 1).padStart(4, '0')}`
}

export default function CreateOrder() {
  const { state, dispatch, notify, session } = useDemo()
  const [params, setParams] = useSearchParams()
  const branch = BRANCH_BY_ID[session.branchId]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('C-001')
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  const products = useMemo(() => state.medicines.map((m) => ({ ...m, avail: availableUnits(state.inventory, session.branchId, m.id) })), [state.medicines, state.inventory, session.branchId])

  const addItem = (m, qty = 1) => {
    const avail = availableUnits(state.inventory, session.branchId, m.id)
    setCart((c) => {
      const cur = c.find((x) => x.medicineId === m.id)?.qty || 0
      if (avail <= 0) { notify(`${m.name} has no sellable stock at ${branch.name}`, 'danger'); return c }
      if (cur + qty > avail) { notify(`Only ${avail} units of ${m.name} available`, 'warning'); return c }
      return cur ? c.map((x) => (x.medicineId === m.id ? { ...x, qty: x.qty + qty } : x)) : [...c, { medicineId: m.id, qty }]
    })
  }

  // "Add to order" from the catalogue arrives as ?add=MED-xxx
  useEffect(() => {
    const id = params.get('add')
    if (!id) return
    const m = state.medicines.find((x) => x.id === id)
    if (m) addItem(m)
    setParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setQty = (medicineId, qty) => {
    const avail = availableUnits(state.inventory, session.branchId, medicineId)
    if (qty <= 0) { setCart((c) => c.filter((x) => x.medicineId !== medicineId)); return }
    if (qty > avail) { notify(`Only ${avail} units available`, 'warning'); return }
    setCart((c) => c.map((x) => (x.medicineId === medicineId ? { ...x, qty } : x)))
  }

  const lines = cart.map((l) => {
    const m = state.medicines.find((x) => x.id === l.medicineId)
    return { ...l, m, total: m ? m.salePrice * l.qty : 0, avail: availableUnits(state.inventory, session.branchId, l.medicineId) }
  })
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const errors = {
    empty: lines.length === 0 && 'Add at least one medicine to prepare the order',
    stock: lines.find((l) => l.qty > l.avail) && `Reduce quantity for ${lines.find((l) => l.qty > l.avail).m.name}`,
  }
  const hasErr = Object.values(errors).some(Boolean)

  const visible = products.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    const q = query.trim().toLowerCase()
    return !q || `${p.name} ${p.generic} ${p.barcode}`.toLowerCase().includes(q)
  })

  const send = () => {
    setTouched(true)
    if (hasErr) return
    const cust = CUSTOMERS.find((c) => c.id === customerId)
    const order = {
      id: nextOrderId(state.orders),
      branchId: session.branchId,
      customerName: cust.name,
      createdAt: ANCHOR.toISOString(),
      items: lines.map((l) => ({ medicineId: l.medicineId, name: l.m.name, qty: l.qty, price: l.m.salePrice })),
      notes: notes.trim(),
      status: 'Pending',
      by: branch.salesCounter,
    }
    dispatch({ type: 'SEND_ORDER', order })
    notify(`${order.id} sent to billing · ${order.items.length} lines`, 'info')
    setCart([])
    setNotes('')
    setCustomerId('C-001')
    setTouched(false)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={['Sales counter', 'Counter', 'Create order']}
        title="Create order"
        subtitle="Search, select and prepare the customer's medicines, then send the order to the cashier."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 380px' }, gap: 2.5, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Card sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth size="small" placeholder="Search medicine by name, generic or barcode…" value={query} onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color={palette.textMuted} /></InputAdornment> } }}
            />
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              {['All', ...CATEGORIES].map((c) => (
                <Chip key={c} size="small" label={c} onClick={() => setCategory(c)} color={category === c ? 'primary' : 'default'} variant={category === c ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
              ))}
            </Stack>
          </Card>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 1.5 }}>
            {visible.map((p) => {
              const inCart = cart.find((c) => c.medicineId === p.id)?.qty || 0
              const out = p.avail <= 0
              return (
                <Card key={p.id} sx={{ p: 1.75, display: 'flex', flexDirection: 'column', opacity: out ? 0.6 : 1, borderColor: inCart ? palette.blue : palette.border }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, bgcolor: `${CATEGORY_COLORS[p.category]}1F`, color: CATEGORY_COLORS[p.category], display: 'grid', placeItems: 'center', fontWeight: 800 }}>{p.name.slice(0, 1)}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{p.generic}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" sx={{ mt: 1.25, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={700}>{formatPKR(p.salePrice)}</Typography>
                    <Typography variant="caption" color={out ? 'error.main' : 'text.secondary'} fontWeight={600}>{out ? 'Out of stock' : `${p.avail} avail.`}</Typography>
                  </Stack>
                  <Button size="small" variant={inCart ? 'outlined' : 'contained'} disabled={out} onClick={() => addItem(p)} sx={{ mt: 1.25 }}>
                    {inCart ? `In order · ${inCart} · add 1` : 'Add to order'}
                  </Button>
                </Card>
              )
            })}
            {visible.length === 0 && <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 5 }}>No medicines found.</Typography>}
          </Box>
        </Box>

        <Card sx={{ position: { lg: 'sticky' }, top: { lg: 84 } }}>
          <Stack direction="row" sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ShoppingBasket size={18} color={palette.navy} />
              <Typography variant="h3">Order draft</Typography>
              <Chip size="small" label={`${cart.reduce((s, c) => s + c.qty, 0)} units`} />
            </Stack>
            {cart.length > 0 && <Button size="small" color="inherit" onClick={() => setCart([])} sx={{ color: 'text.secondary' }}>Clear</Button>}
          </Stack>
          <Box sx={{ px: 2.25, py: 1.5, maxHeight: 360, overflowY: 'auto' }}>
            {lines.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No items yet. Add medicines from the list.</Typography>}
            <Stack spacing={1.25}>
              {lines.map((l) => (
                <Box key={l.medicineId} sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${l.qty > l.avail ? palette.danger : palette.border}` }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{l.m?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatPKR(l.m?.salePrice)} each</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setQty(l.medicineId, 0)} aria-label="Remove item"><Trash2 size={15} /></IconButton>
                  </Stack>
                  <Stack direction="row" sx={{ mt: 0.75, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" sx={{ border: `1px solid ${palette.border}`, borderRadius: 2, alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => setQty(l.medicineId, l.qty - 1)} aria-label="Decrease"><Minus size={14} /></IconButton>
                      <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{l.qty}</Typography>
                      <IconButton size="small" onClick={() => setQty(l.medicineId, l.qty + 1)} aria-label="Increase"><Plus size={14} /></IconButton>
                    </Stack>
                    <Typography fontWeight={600}>{formatPKR(l.total)}</Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ px: 2.25, py: 1.75 }}>
            <Stack spacing={1.5}>
              <TextField select size="small" label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} fullWidth>
                {CUSTOMERS.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Notes for cashier (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={1} />
            </Stack>
            <Stack direction="row" sx={{ mt: 2, justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Estimated subtotal</Typography>
              <Typography fontWeight={700}>{formatPKR(subtotal)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block',  mt: 0.5 }}>Discounts and payment are applied by the cashier.</Typography>
            {touched && errors.empty && <Alert severity="info" sx={{ mt: 1.5, py: 0, borderRadius: 2 }}>{errors.empty}</Alert>}
            {touched && errors.stock && <Alert severity="error" sx={{ mt: 1.5, py: 0, borderRadius: 2 }}>{errors.stock}</Alert>}
            <Button fullWidth variant="contained" startIcon={<Send size={15} />} onClick={send} sx={{ mt: 2, py: 1.1 }}>Send to cashier</Button>
          </Box>
        </Card>
      </Box>
    </>
  )
}
