import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Grid, IconButton, MenuItem, Stack, TextField, Typography, Button } from '@mui/material'
import { Plus, Trash2 } from 'lucide-react'
import FormDialog from './FormDialog'
import { BRANCHES, MEDICINES, SUPPLIERS, MEDICINE_BY_ID, toDayKey, addDays, ANCHOR } from '../../data/demoData'
import { formatPKR } from '../../utils/format'

export default function PurchaseOrderDialog({ open, onClose, onSubmit, defaultBranch = 'main' }) {
  const [supplierId, setSupplierId] = useState('')
  const [branchId, setBranchId] = useState(defaultBranch)
  const [expected, setExpected] = useState(toDayKey(addDays(ANCHOR, 7)))
  const [lines, setLines] = useState([{ medicineId: '', qty: '', unitCost: '' }])
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setSupplierId(''); setBranchId(defaultBranch); setExpected(toDayKey(addDays(ANCHOR, 7)))
      setLines([{ medicineId: '', qty: '', unitCost: '' }]); setTouched(false)
    }
  }, [open, defaultBranch])

  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0), [lines])

  const setLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const pickMedicine = (i, medicineId) => {
    const m = MEDICINE_BY_ID[medicineId]
    setLine(i, { medicineId, unitCost: m ? String(m.purchasePrice) : '' })
  }

  const errors = {}
  if (!supplierId) errors.supplier = 'Choose a supplier'
  if (!expected) errors.expected = 'Expected date is required'
  const validLines = lines.filter((l) => l.medicineId)
  if (validLines.length === 0) errors.lines = 'Add at least one medicine'
  lines.forEach((l, i) => {
    if (l.medicineId && (!l.qty || Number(l.qty) <= 0)) errors[`qty${i}`] = 'Qty required'
    if (l.medicineId && (!l.unitCost || Number(l.unitCost) <= 0)) errors[`cost${i}`] = 'Cost required'
  })
  const hasErrors = Object.keys(errors).length > 0

  const submit = () => {
    setTouched(true)
    if (hasErrors) return
    const po = {
      id: `PO-2026-${String(Math.floor(200 + Math.random() * 800)).padStart(4, '0')}`,
      supplierId,
      branchId,
      orderDate: toDayKey(ANCHOR),
      expectedDate: expected,
      items: validLines.map((l) => ({ medicineId: l.medicineId, name: MEDICINE_BY_ID[l.medicineId].name, qty: Number(l.qty), unitCost: Number(l.unitCost), received: 0 })),
      total,
      status: 'Pending Approval',
      paid: 0,
      paymentHistory: [],
    }
    onSubmit(po)
  }

  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel="Submit for approval" title="New purchase order" subtitle="Orders are approved by the owner before they are sent to the supplier." maxWidth="md">
      {touched && hasErrors && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>Please complete the highlighted fields.</Alert>}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField select label="Supplier" required fullWidth size="small" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} error={touched && !!errors.supplier} helperText={touched && errors.supplier ? errors.supplier : ' '}>
            {SUPPLIERS.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select label="Deliver to branch" fullWidth size="small" value={branchId} onChange={(e) => setBranchId(e.target.value)} helperText=" ">
            {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField label="Expected date" required type="date" fullWidth size="small" value={expected} onChange={(e) => setExpected(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} error={touched && !!errors.expected} helperText={touched && errors.expected ? errors.expected : ' '} />
        </Grid>
      </Grid>

      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Items</Typography>
      <Stack spacing={1.25} sx={{ mt: 0.5 }}>
        {lines.map((l, i) => (
          <Grid container spacing={1.5} key={i} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 5.5 }}>
              <TextField select label="Medicine" fullWidth size="small" value={l.medicineId} onChange={(e) => pickMedicine(i, e.target.value)}>
                {MEDICINES.map((m) => <MenuItem key={m.id} value={m.id}>{m.name} · {m.pack}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 5, sm: 2.5 }}>
              <TextField label="Qty (units)" fullWidth size="small" type="number" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} error={touched && !!errors[`qty${i}`]} helperText={touched && errors[`qty${i}`] ? errors[`qty${i}`] : ' '} />
            </Grid>
            <Grid size={{ xs: 5, sm: 2.5 }}>
              <TextField label="Unit cost (Rs.)" fullWidth size="small" type="number" value={l.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} error={touched && !!errors[`cost${i}`]} helperText={touched && errors[`cost${i}`] ? errors[`cost${i}`] : ' '} />
            </Grid>
            <Grid size={{ xs: 2, sm: 1.5 }} sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
              <IconButton size="small" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} disabled={lines.length === 1} aria-label="Remove line">
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Stack>
      <Button size="small" startIcon={<Plus size={15} />} onClick={() => setLines((ls) => [...ls, { medicineId: '', qty: '', unitCost: '' }])} sx={{ mt: 1 }}>
        Add item
      </Button>
      {touched && errors.lines && <Typography variant="caption" color="error">{errors.lines}</Typography>}
      <Box sx={{ mt: 2, p: 1.75, borderRadius: 2, bgcolor: '#F6F8FB', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Order total</Typography>
        <Typography variant="body1" fontWeight={700}>{formatPKR(total)}</Typography>
      </Box>
    </FormDialog>
  )
}
