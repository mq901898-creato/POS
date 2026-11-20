import { useEffect, useState } from 'react'
import { Grid, MenuItem, TextField } from '@mui/material'
import FormDialog from './FormDialog'

const blank = { name: '', contact: '', phone: '', city: '', terms: '30 days' }

export default function SupplierFormDialog({ open, onClose, supplier, onSubmit }) {
  const [form, setForm] = useState(blank)
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (open) { setForm(supplier ? { ...blank, ...supplier } : blank); setTouched(false) } }, [open, supplier])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const errors = {
    name: !form.name.trim() && 'Supplier name is required',
    contact: !form.contact.trim() && 'Contact person is required',
    phone: !/^[0-9+\-\s]{7,20}$/.test(form.phone) && 'Enter a valid phone number',
    city: !form.city.trim() && 'City is required',
  }
  const hasErr = Object.values(errors).some(Boolean)
  const submit = () => {
    setTouched(true)
    if (hasErr) return
    onSubmit({ ...form, id: supplier?.id || `SUP-${String(Date.now()).slice(-4)}` })
  }
  const err = (k) => touched && errors[k]
  return (
    <FormDialog open={open} onClose={onClose} onSave={submit} saveLabel={supplier ? 'Save supplier' : 'Add supplier'} title={supplier ? 'Edit supplier' : 'Add supplier'}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}><TextField label="Supplier / distributor name" required fullWidth size="small" value={form.name} onChange={set('name')} error={!!err('name')} helperText={err('name') || ' '} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label="Contact person" required fullWidth size="small" value={form.contact} onChange={set('contact')} error={!!err('contact')} helperText={err('contact') || ' '} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" required fullWidth size="small" value={form.phone} onChange={set('phone')} error={!!err('phone')} helperText={err('phone') || ' '} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label="City" required fullWidth size="small" value={form.city} onChange={set('city')} error={!!err('city')} helperText={err('city') || ' '} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="Payment terms" fullWidth size="small" value={form.terms} onChange={set('terms')} helperText=" ">
            {['15 days', '30 days', '45 days', '60 days'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </FormDialog>
  )
}
