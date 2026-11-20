import { useEffect, useState } from 'react'
import { MenuItem, Stack, TextField, Typography, Box } from '@mui/material'
import FormDialog from './FormDialog'
import { formatPKR } from '../../utils/format'
import { SUPPLIER_BY_ID } from '../../data/demoData'

export default function RecordPaymentDialog({ open, onClose, po, onSubmit }) {
  const due = po ? po.total - po.paid : 0
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank Transfer')
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (open) { setAmount(''); setMethod('Bank Transfer'); setTouched(false) } }, [open])
  if (!po) return null
  const n = Number(amount)
  const error = touched && (!amount || n <= 0 ? 'Enter an amount' : n > due ? `Cannot exceed balance of ${formatPKR(due)}` : '')
  const submit = () => {
    setTouched(true)
    if (!amount || n <= 0 || n > due) return
    onSubmit({ amount: n, method })
  }
  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel="Record payment" title="Record supplier payment" subtitle={`${po.id} · ${SUPPLIER_BY_ID[po.supplierId]?.name}`}>
      <Stack spacing={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, p: 1.75, bgcolor: '#F6F8FB', borderRadius: 2 }}>
          <div><Typography variant="caption" color="text.secondary">Order total</Typography><Typography fontWeight={600}>{formatPKR(po.total)}</Typography></div>
          <div><Typography variant="caption" color="text.secondary">Paid</Typography><Typography fontWeight={600}>{formatPKR(po.paid)}</Typography></div>
          <div><Typography variant="caption" color="text.secondary">Balance due</Typography><Typography fontWeight={600} color="error.main">{formatPKR(due)}</Typography></div>
        </Box>
        <TextField label="Amount (Rs.)" required type="number" size="small" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} error={!!error} helperText={error || ' '} />
        <TextField select label="Payment method" size="small" fullWidth value={method} onChange={(e) => setMethod(e.target.value)}>
          {['Bank Transfer', 'Cheque', 'Cash', 'Mobile Wallet'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
      </Stack>
    </FormDialog>
  )
}
