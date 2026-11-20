import { useEffect, useState } from 'react'
import { Alert, Box, Grid, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import FormDialog from './FormDialog'
import { BRANCH_BY_ID } from '../../data/demoData'
import { fmtDay } from '../../utils/format'

const REASONS = ['Stock count correction', 'Damaged packaging', 'Expired — written off', 'Returned to supplier', 'Received without PO', 'Theft / loss']

/** Adjust a single branch batch: add, remove or set a counted quantity. */
export default function StockAdjustDialog({ open, onClose, row, medicine, onSubmit }) {
  const [mode, setMode] = useState('remove')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) { setMode('remove'); setQty(''); setReason(''); setTouched(false) }
  }, [open])

  if (!row || !medicine) return null
  const current = row.qty
  const n = Number(qty)
  const delta = mode === 'add' ? n : mode === 'remove' ? -n : n - current
  const newQty = current + delta

  const errors = {}
  if (qty === '' || Number.isNaN(n)) errors.qty = 'Enter a quantity'
  else if (mode !== 'set' && n <= 0) errors.qty = 'Must be greater than zero'
  else if (mode === 'set' && n < 0) errors.qty = 'Cannot be negative'
  else if (newQty < 0) errors.qty = `Only ${current} units available in this batch`
  if (!reason) errors.reason = 'Select a reason for the audit trail'

  const submit = () => {
    setTouched(true)
    if (Object.keys(errors).length) return
    onSubmit({ inventoryId: row.id, delta, reason })
  }

  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel="Apply adjustment" title="Stock adjustment" subtitle={`${medicine.name} · ${BRANCH_BY_ID[row.branchId].name}`}>
      <Stack spacing={2.5}>
        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: '#F6F8FB', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          <div><Typography variant="caption" color="text.secondary">Batch</Typography><Typography variant="body2" fontWeight={600}>{row.batchNo}</Typography></div>
          <div><Typography variant="caption" color="text.secondary">Expiry</Typography><Typography variant="body2" fontWeight={600}>{fmtDay(row.expiry)}</Typography></div>
          <div><Typography variant="caption" color="text.secondary">On hand</Typography><Typography variant="body2" fontWeight={600}>{current} units</Typography></div>
        </Box>

        <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && setMode(v)} fullWidth>
          <ToggleButton value="add">Add stock</ToggleButton>
          <ToggleButton value="remove">Remove stock</ToggleButton>
          <ToggleButton value="set">Set counted qty</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              label={mode === 'set' ? 'Counted quantity' : 'Quantity'}
              required fullWidth size="small" type="number" value={qty} onChange={(e) => setQty(e.target.value)}
              error={touched && !!errors.qty} helperText={touched && errors.qty ? errors.qty : ' '}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField select label="Reason" required fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} error={touched && !!errors.reason} helperText={touched && errors.reason ? errors.reason : ' '}>
              {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        {qty !== '' && !errors.qty && (
          <Alert severity={newQty < (medicine.minStock || 0) ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
            New balance will be <strong>{newQty} units</strong>
            {newQty < (medicine.minStock || 0) ? ` — below the minimum of ${medicine.minStock}.` : '.'}
          </Alert>
        )}
      </Stack>
    </FormDialog>
  )
}
