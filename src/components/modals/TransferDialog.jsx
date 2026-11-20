import { useEffect, useMemo, useState } from 'react'
import { Alert, Grid, MenuItem, TextField, Typography } from '@mui/material'
import FormDialog from './FormDialog'
import { BRANCHES, MEDICINES } from '../../data/demoData'
import { uid } from '../../context/DemoContext'
import { toDayKey, ANCHOR } from '../../data/demoData'

/** Request a stock transfer between two branches. Stock never moves automatically. */
export default function TransferDialog({ open, onClose, inventory, onSubmit, defaultFrom = 'main' }) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState('b03')
  const [medicineId, setMedicineId] = useState('')
  const [qty, setQty] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (open) { setFrom(defaultFrom); setTo(defaultFrom === 'b03' ? 'main' : 'b03'); setMedicineId(''); setQty(''); setTouched(false) } }, [open, defaultFrom])

  const available = useMemo(
    () => inventory.filter((r) => r.branchId === from && r.medicineId === medicineId).reduce((s, r) => s + r.qty, 0),
    [inventory, from, medicineId]
  )
  const n = Number(qty)
  const errors = {
    from: from === to && 'Source and destination must differ',
    medicine: !medicineId && 'Choose a medicine',
    qty: !qty || n <= 0 ? 'Enter a quantity' : n > available ? `Only ${available} units available at source` : '',
  }
  const hasErr = Object.values(errors).some(Boolean)

  const submit = () => {
    setTouched(true)
    if (hasErr) return
    onSubmit({ id: uid('TRF'), from, to, medicineId, qty: n, status: 'Awaiting Dispatch', requestedBy: 'Owner', date: toDayKey(ANCHOR) })
  }

  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel="Request transfer" title="Request stock transfer" subtitle="Requests are approved and tracked; branch stock is only moved on dispatch and receipt.">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="From branch" fullWidth size="small" value={from} onChange={(e) => setFrom(e.target.value)} error={touched && !!errors.from} helperText={touched && errors.from ? errors.from : ' '}>
            {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="To branch" fullWidth size="small" value={to} onChange={(e) => setTo(e.target.value)} helperText=" ">
            {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField select label="Medicine" fullWidth size="small" value={medicineId} onChange={(e) => setMedicineId(e.target.value)} error={touched && !!errors.medicine} helperText={touched && errors.medicine ? errors.medicine : ' '}>
            {MEDICINES.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Quantity" fullWidth size="small" type="number" value={qty} onChange={(e) => setQty(e.target.value)} error={touched && !!errors.qty} helperText={touched && errors.qty ? errors.qty : medicineId ? `Available at source: ${available}` : ' '} />
        </Grid>
      </Grid>
      {medicineId && <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}><Typography variant="body2">Stock is deducted from the source branch when dispatched and added to the destination on receipt.</Typography></Alert>}
    </FormDialog>
  )
}
