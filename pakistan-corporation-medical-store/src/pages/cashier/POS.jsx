import { useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Chip, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Card } from '@mui/material'
import { Minus, Plus, ScanBarcode, Search, ShoppingCart, Trash2, Receipt, Inbox } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import ReceiptDialog from '../../components/modals/ReceiptDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, CATEGORIES, CATEGORY_COLORS, CUSTOMERS, MEDICINE_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { availableUnits, nearestBatch, localKey } from '../../utils/analytics'
import { fmtDay, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

const PAYMENTS = ['Cash', 'Card', 'Bank Transfer', 'Mobile Wallet']

export default function POS() {
  const { state, dispatch, notify, session, allSales } = useDemo()
  const branchId = session.branchId
  const branch = BRANCH_BY_ID[branchId]
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('C-001')
  const [discount, setDiscount] = useState('')
  const [payment, setPayment] = useState('Cash')
  const [tendered, setTendered] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [touched, setTouched] = useState(false)
  const barcodeRef = useRef(null)

  const products = useMemo(() => state.medicines.map((m) => ({
    ...m,
    avail: availableUnits(state.inventory, branchId, m.id),
    batch: nearestBatch(state.inventory, branchId, m.id),
  })), [state.medicines, state.inventory, branchId])

  const visible = products.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${p.name} ${p.generic} ${p.barcode}`.toLowerCase().includes(q)
  })

  const lines = cart.map((l) => {
    const med = products.find((p) => p.id === l.medicineId) || MEDICINE_BY_ID[l.medicineId]
    return { ...l, med, avail: availableUnits(state.inventory, branchId, l.medicineId), total: l.qty * med.salePrice }
  })
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const discountAmt = Number(discount) || 0
  const discountError = discountAmt < 0 || discountAmt > subtotal
  const grandTotal = Math.max(0, subtotal - discountAmt)
  const tenderedAmt = Number(tendered) || 0
  const change = payment === 'Cash' ? tenderedAmt - grandTotal : 0
  const stockIssues = lines.filter((l) => l.qty > l.avail)
  const cartErrors = {
    empty: lines.length === 0 && 'Add at least one medicine to the cart',
    discount: discountError && 'Discount cannot be negative or more than the subtotal',
    tender: payment === 'Cash' && tendered !== '' && tenderedAmt < grandTotal && 'Amount tendered is less than the total',
    stock: stockIssues.length > 0 && `Insufficient stock for ${stockIssues[0].med.name}`,
  }
  const hasErr = Object.values(cartErrors).some(Boolean)

  const addToCart = (med, qty = 1) => {
    const avail = availableUnits(state.inventory, branchId, med.id)
    const current = cart.find((c) => c.medicineId === med.id)?.qty || 0
    if (avail <= 0) { notify(`${med.name} is out of stock at ${branch.name}`, 'danger'); return }
    if (current + qty > avail) { notify(`Only ${avail} units of ${med.name} available`, 'warning'); return }
    setCart((c) => (current ? c.map((x) => (x.medicineId === med.id ? { ...x, qty: x.qty + qty } : x)) : [...c, { medicineId: med.id, qty }]))
  }
  const setQty = (medicineId, qty) => {
    const avail = availableUnits(state.inventory, branchId, medicineId)
    if (qty <= 0) { setCart((c) => c.filter((x) => x.medicineId !== medicineId)); return }
    if (qty > avail) { notify(`Only ${avail} units available`, 'warning'); return }
    setCart((c) => c.map((x) => (x.medicineId === medicineId ? { ...x, qty } : x)))
  }
  const clearAll = () => { setCart([]); setDiscount(''); setTendered(''); setOrderId(null); setTouched(false) }

  const onBarcode = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = barcode.trim()
    const med = state.medicines.find((m) => m.barcode === code)
    if (!med) { notify(`No medicine found for barcode ${code || '(empty)'}`, 'danger'); return }
    addToCart(med)
    setBarcode('')
    barcodeRef.current?.focus()
  }

  const loadOrder = (order) => {
    if (cart.length && !window.confirm('Replace the current cart with this order?')) return
    const items = []
    const shortages = []
    order.items.forEach((it) => {
      const avail = availableUnits(state.inventory, branchId, it.medicineId)
      const qty = Math.min(it.qty, avail)
      if (qty < it.qty) shortages.push(`${it.name} (${qty}/${it.qty})`)
      if (qty > 0) items.push({ medicineId: it.medicineId, qty })
    })
    setCart(items)
    setOrderId(order.id)
    setCustomerId(CUSTOMERS.find((c) => c.name === order.customerName)?.id || 'C-001')
    setDiscount('')
    setTendered('')
    dispatch({ type: 'SET_ORDER_STATUS', id: order.id, status: 'In Billing' })
    notify(shortages.length ? `Order ${order.id} loaded · short stock: ${shortages.join(', ')}` : `Order ${order.id} loaded into cart`, shortages.length ? 'warning' : 'info')
  }

  const completeSale = () => {
    setTouched(true)
    if (hasErr) return
    const todayKey = toDayKey(ANCHOR)
    const seq = allSales.filter((s) => s.branchId === branchId && localKey(s.createdAt) === todayKey).length + 1
    const customer = CUSTOMERS.find((c) => c.id === customerId)
    const sale = {
      id: `PCMS-${branch.code}-${todayKey.replace(/-/g, '')}-${String(seq).padStart(3, '0')}`,
      branchId,
      createdAt: ANCHOR.toISOString(),
      cashier: branch.cashier,
      customerId: customer.id,
      customerName: customer.name,
      items: lines.map((l) => ({ medicineId: l.medicineId, name: l.med.name, qty: l.qty, price: l.med.salePrice, cost: l.med.purchasePrice })),
      subtotal,
      discount: discountAmt,
      total: grandTotal,
      payment,
      status: 'Completed',
      refundAmount: 0,
      refundReason: '',
    }
    dispatch({ type: 'COMPLETE_SALE', sale, orderId })
    notify(`Sale ${sale.id} completed · ${formatPKR(grandTotal)} · ${payment}`)
    setReceipt(sale)
    clearAll()
  }

  const pendingOrders = state.orders.filter((o) => o.branchId === branchId && o.status === 'Pending')
  const cats = ['All', ...CATEGORIES]

  return (
    <>
      <PageHeader
        breadcrumbs={['Cashier', 'Billing', 'POS']}
        title="Point of sale"
        subtitle={`${branch.name} · ${branch.city} · Cashier ${branch.cashier} · ${fmtDay(toDayKey(ANCHOR))}`}
      />

      {pendingOrders.length > 0 && (
        <Card sx={{ p: 1.75, mb: 2, borderColor: palette.blue, bgcolor: palette.blueSoft }}>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Inbox size={18} color={palette.blue} />
            <Typography variant="body2" fontWeight={600} color={palette.blue}>Incoming from sales counter</Typography>
            {pendingOrders.map((o) => (
              <Chip
                key={o.id}
                onClick={() => loadOrder(o)}
                label={`${o.id} · ${o.customerName} · ${o.items.reduce((s, i) => s + i.qty, 0)} units`}
                sx={{ bgcolor: '#fff', border: `1px solid ${palette.border}`, fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 380px' }, gap: 2.5, alignItems: 'start' }}>
        {/* LEFT — catalogue */}
        <Box sx={{ minWidth: 0 }}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                inputRef={(el) => { barcodeRef.current = el }}
                fullWidth
                size="small"
                placeholder="Scan barcode + Enter"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={onBarcode}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><ScanBarcode size={17} color={palette.textMuted} /></InputAdornment> } }}
                sx={{ maxWidth: { md: 320 } }}
              />
              <TextField
                fullWidth
                size="small"
                placeholder="Search medicine, generic name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color={palette.textMuted} /></InputAdornment> } }}
              />
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              {cats.map((c) => (
                <Chip
                  key={c}
                  size="small"
                  label={c}
                  onClick={() => setCategory(c)}
                  variant={category === c ? 'filled' : 'outlined'}
                  color={category === c ? 'primary' : 'default'}
                  sx={{ fontWeight: 600, px: 0.5 }}
                />
              ))}
            </Stack>
          </Card>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(172px, 1fr))', gap: 1.5 }}>
            {visible.map((p) => {
              const out = p.avail <= 0
              const low = !out && p.avail < p.minStock
              const inCart = cart.find((c) => c.medicineId === p.id)?.qty || 0
              return (
                <Card
                  key={p.id}
                  onClick={() => !out && addToCart(p)}
                  sx={{
                    p: 1.5, cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.55 : 1, position: 'relative',
                    transition: 'border-color .15s, transform .15s',
                    '&:hover': out ? {} : { borderColor: palette.blue, transform: 'translateY(-1px)' },
                    borderColor: inCart ? palette.blue : palette.border,
                  }}
                >
                  <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: `${CATEGORY_COLORS[p.category]}18`, color: CATEGORY_COLORS[p.category], display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
                      {p.name.slice(0, 1)}
                    </Box>
                    {inCart > 0 && <Chip size="small" color="primary" label={`×${inCart}`} sx={{ height: 20, fontWeight: 700 }} />}
                  </Stack>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3, minHeight: 36 }}>{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 30, lineHeight: 1.3 }}>{p.generic}</Typography>
                  <Stack direction="row" sx={{ mt: 1, justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography fontWeight={700} color={palette.navy}>{formatPKR(p.salePrice)}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: out ? 'error.main' : low ? 'warning.dark' : 'success.dark' }}>
                      {out ? 'Out of stock' : `${p.avail} in stock`}
                    </Typography>
                  </Stack>
                </Card>
              )
            })}
            {visible.length === 0 && <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', py: 4, textAlign: 'center' }}>No medicines match this search.</Typography>}
          </Box>
        </Box>

        {/* RIGHT — cart */}
        <Card sx={{ position: { lg: 'sticky' }, top: { lg: 84 }, display: 'flex', flexDirection: 'column', maxHeight: { lg: 'calc(100vh - 100px)' } }}>
          <Stack direction="row" sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ShoppingCart size={18} color={palette.navy} />
              <Typography variant="h3">Current sale</Typography>
              <Chip size="small" label={`${cart.reduce((s, c) => s + c.qty, 0)} items`} />
            </Stack>
            {(cart.length > 0 || orderId) && <Button size="small" color="inherit" onClick={clearAll} sx={{ color: 'text.secondary' }}>Clear</Button>}
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.25, py: 1.5, minHeight: 120 }}>
            {orderId && <Chip size="small" label={`From order ${orderId}`} color="info" variant="outlined" sx={{ mb: 1 }} />}
            {lines.length === 0 && (
              <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                <ShoppingCart size={30} style={{ opacity: 0.4 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>Select medicines or scan a barcode to start a sale.</Typography>
              </Box>
            )}
            <Stack spacing={1.25}>
              {lines.map((l) => (
                <Box key={l.medicineId} sx={{ p: 1.25, border: `1px solid ${l.qty > l.avail ? palette.danger : palette.border}`, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{l.med.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatPKR(l.med.salePrice)} each · {l.avail} available</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setQty(l.medicineId, 0)} aria-label="Remove item"><Trash2 size={15} /></IconButton>
                  </Stack>
                  <Stack direction="row" sx={{ mt: 0.75, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={0.5} sx={{ border: `1px solid ${palette.border}`, borderRadius: 2, alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => setQty(l.medicineId, l.qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></IconButton>
                      <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{l.qty}</Typography>
                      <IconButton size="small" onClick={() => setQty(l.medicineId, l.qty + 1)} aria-label="Increase quantity"><Plus size={14} /></IconButton>
                    </Stack>
                    <Typography fontWeight={700}>{formatPKR(l.total)}</Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider />
          <Box sx={{ px: 2.25, py: 1.75 }}>
            <Stack spacing={1.5}>
              <TextField select size="small" label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} fullWidth>
                {CUSTOMERS.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}{c.phone !== '—' ? ` · ${c.phone}` : ''}</MenuItem>)}
              </TextField>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  size="small"
                  label="Discount (Rs.)"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  error={touched && !!cartErrors.discount}
                  helperText={touched && cartErrors.discount ? cartErrors.discount : ' '}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.75 }}>Payment method</Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={payment}
                  onChange={(_, v) => v && setPayment(v)}
                  sx={{ flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButton-root': { flex: '1 1 45%', borderRadius: '8px !important', border: `1px solid ${palette.border} !important`, whiteSpace: 'nowrap', fontSize: 12.5 } }}
                >
                  {PAYMENTS.map((p) => <ToggleButton key={p} value={p}>{p}</ToggleButton>)}
                </ToggleButtonGroup>
              </Box>
              {payment === 'Cash' && (
                <TextField
                  size="small"
                  label="Amount tendered (Rs.)"
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  error={touched && !!cartErrors.tender}
                  helperText={touched && cartErrors.tender ? cartErrors.tender : tendered !== '' && change >= 0 ? `Change due: ${formatPKR(change)}` : ' '}
                />
              )}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ px: 2.25, py: 1.75, bgcolor: '#F8FAFC' }}>
            <Row label="Subtotal" value={formatPKR(subtotal)} />
            <Row label="Discount" value={`- ${formatPKR(discountAmt)}`} />
            <Row label="Grand total" value={formatPKR(grandTotal)} bold />
            {touched && cartErrors.stock && <Alert severity="error" sx={{ mt: 1.25, py: 0, borderRadius: 2 }}>{cartErrors.stock}</Alert>}
            {touched && cartErrors.empty && <Alert severity="info" sx={{ mt: 1.25, py: 0, borderRadius: 2 }}>{cartErrors.empty}</Alert>}
            <Button fullWidth variant="contained" size="large" startIcon={<Receipt size={17} />} onClick={completeSale} sx={{ mt: 1.5, py: 1.2, fontSize: 15 }}>
              Complete sale · {formatPKR(grandTotal)}
            </Button>
          </Box>
        </Card>
      </Box>

      <ReceiptDialog open={!!receipt} onClose={() => setReceipt(null)} sale={receipt} />
    </>
  )
}

function Row({ label, value, bold }) {
  return (
    <Stack direction="row" sx={{ py: 0.35, justifyContent: 'space-between' }}>
      <Typography variant="body2" color={bold ? 'text.primary' : 'text.secondary'} fontWeight={bold ? 700 : 400} sx={{ fontSize: bold ? 15 : 13.5 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 500} sx={{ fontSize: bold ? 17 : 13.5 }}>{value}</Typography>
    </Stack>
  )
}
