import { useEffect, useState } from 'react'
import { Alert, MenuItem, Stack, TextField, Typography, Box } from '@mui/material'
import FormDialog from './FormDialog'
import { formatPKR, fmtDateTime } from '../../utils/format'

const REASONS = ['Wrong medicine given', 'Customer changed mind', 'Packaging damaged', 'Prescription not matched', 'Expiry concern']

export default function RefundDialog({ open, onClose, sale, onConfirm }) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (open) { setReason(''); setTouched(false) } }, [open])
  if (!sale) return null
  const submit = () => {
    setTouched(true)
    if (!reason) return
    onConfirm(reason)
  }
  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel={`Refund ${formatPKR(sale.total)}`} saveDisabled={sale.status === 'Refunded'} color="error" title="Refund / return" subtitle={`${sale.id} · ${fmtDateTime(sale.createdAt)}`}>
      <Stack spacing={2}>
        {sale.status === 'Refunded' ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>This invoice has already been refunded in full.</Alert>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>Items are returned to this branch's stock. Cash or card refunds are settled at the counter.</Alert>
        )}
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {sale.items.map((it) => (
            <Stack key={it.medicineId} direction="row" sx={{ px: 1.75, py: 1, borderBottom: '1px solid', borderColor: 'divider', fontSize: 13.5, justifyContent: 'space-between' }}>
              <span>{it.name} <Typography component="span" variant="caption" color="text.secondary">× {it.qty}</Typography></span>
              <span>{formatPKR(it.qty * it.price)}</span>
            </Stack>
          ))}
          <Stack direction="row" sx={{ px: 1.75, py: 1.25, bgcolor: '#F6F8FB', fontWeight: 700, justifyContent: 'space-between' }}>
            <span>Refund amount</span><span>{formatPKR(sale.total)}</span>
          </Stack>
        </Box>
        <TextField select label="Reason for refund" required size="small" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} error={touched && !reason} helperText={touched && !reason ? 'Select a reason' : ' '}>
          {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
      </Stack>
    </FormDialog>
  )
}
