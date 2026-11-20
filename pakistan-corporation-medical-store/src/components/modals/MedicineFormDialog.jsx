import { useEffect, useMemo, useState } from 'react'
import { Grid, MenuItem, TextField, Typography, Alert, Stack } from '@mui/material'
import FormDialog from './FormDialog'
import { CATEGORIES, BRANCHES, MEDICINES, toDayKey, addDays, ANCHOR } from '../../data/demoData'
import { uid } from '../../context/DemoContext'

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Drops', 'Sachet', 'Cream', 'Inhaler', 'Injection']
const blank = {
  name: '', generic: '', category: 'Analgesics', form: 'Tablet', manufacturer: '', barcode: '', purchasePrice: '', salePrice: '', minStock: '', pack: '',
  branchId: 'main', batchNo: '', qty: '', expiry: toDayKey(addDays(ANCHOR, 365)),
}

/**
 * Add or edit a medicine. When adding, the form also assigns opening stock to one branch.
 * Validation runs on submit and on blur so the presenter can show error states.
 */
export default function MedicineFormDialog({ open, onClose, medicine, onSubmit, existingBarcodes = [] }) {
  const isEdit = !!medicine
  const [form, setForm] = useState(blank)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (!open) return
    setTouched({})
    if (medicine) {
      setForm({ ...blank, ...medicine, purchasePrice: String(medicine.purchasePrice), salePrice: String(medicine.salePrice), minStock: String(medicine.minStock) })
    } else {
      setForm({ ...blank, batchNo: `B${String(MEDICINES.length + 1).padStart(3, '0')}-${Math.floor(1000 + Math.random() * 8999)}` })
    }
  }, [open, medicine])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const errors = useMemo(() => {
    const e = {}
    const num = (v) => Number(v)
    if (!form.name.trim()) e.name = 'Medicine name is required'
    if (!form.generic.trim()) e.generic = 'Generic name is required'
    if (!form.manufacturer.trim()) e.manufacturer = 'Manufacturer is required'
    if (!/^\d{8,14}$/.test(form.barcode)) e.barcode = 'Enter an 8–14 digit barcode'
    else if (existingBarcodes.includes(form.barcode) && (!medicine || medicine.barcode !== form.barcode)) e.barcode = 'Barcode already assigned to another medicine'
    if (!form.purchasePrice || num(form.purchasePrice) <= 0) e.purchasePrice = 'Enter a valid purchase price'
    if (!form.salePrice || num(form.salePrice) <= 0) e.salePrice = 'Enter a valid sale price'
    else if (num(form.salePrice) < num(form.purchasePrice)) e.salePrice = 'Sale price is below purchase price'
    if (form.minStock === '' || num(form.minStock) < 0) e.minStock = 'Enter a minimum stock level'
    if (!form.pack.trim()) e.pack = 'Pack size is required'
    if (!isEdit) {
      if (form.qty === '' || num(form.qty) < 0) e.qty = 'Enter opening quantity'
      if (!form.batchNo.trim()) e.batchNo = 'Batch number is required'
      if (!form.expiry) e.expiry = 'Expiry date is required'
      else if (form.expiry <= toDayKey(ANCHOR)) e.expiry = 'Expiry must be a future date'
    }
    return e
  }, [form, existingBarcodes, medicine, isEdit])

  const showErr = (k) => (touched[k] || touched.__submit) && errors[k]
  const hasErrors = Object.keys(errors).length > 0

  const submit = () => {
    setTouched((t) => ({ ...t, __submit: true }))
    if (hasErrors) return
    const medicineRecord = {
      id: isEdit ? medicine.id : uid('MED'),
      name: form.name.trim(),
      generic: form.generic.trim(),
      category: form.category,
      form: form.form,
      manufacturer: form.manufacturer.trim(),
      barcode: form.barcode,
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      minStock: Number(form.minStock),
      pack: form.pack.trim(),
    }
    const stock = !isEdit && Number(form.qty) > 0
      ? { branchId: form.branchId, qty: Number(form.qty), batchNo: form.batchNo.trim(), expiry: form.expiry }
      : null
    onSubmit({ medicine: medicineRecord, stock, isEdit })
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSave={submit}
      saveLabel={isEdit ? 'Save changes' : 'Add medicine'}
      title={isEdit ? 'Edit medicine' : 'Add medicine'}
      subtitle={isEdit ? 'Catalogue details apply to every branch. Stock is managed per branch.' : 'Creates the catalogue entry and opening stock at the selected branch.'}
      maxWidth="md"
    >
      {hasErrors && (touched.__submit) && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>Please correct the highlighted fields.</Alert>
      )}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Catalogue</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5, mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField label="Brand / product name" required fullWidth size="small" value={form.name} onChange={set('name')} onBlur={touch('name')} error={!!showErr('name')} helperText={showErr('name')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField label="Barcode" required fullWidth size="small" value={form.barcode} onChange={set('barcode')} onBlur={touch('barcode')} error={!!showErr('barcode')} helperText={showErr('barcode')} slotProps={{ htmlInput: { inputMode: 'numeric' } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField label="Generic name / composition" required fullWidth size="small" value={form.generic} onChange={set('generic')} onBlur={touch('generic')} error={!!showErr('generic')} helperText={showErr('generic')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField label="Manufacturer" required fullWidth size="small" value={form.manufacturer} onChange={set('manufacturer')} onBlur={touch('manufacturer')} error={!!showErr('manufacturer')} helperText={showErr('manufacturer')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField select label="Category" fullWidth size="small" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField select label="Dosage form" fullWidth size="small" value={form.form} onChange={set('form')}>
            {FORMS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Pack size" required fullWidth size="small" value={form.pack} onChange={set('pack')} onBlur={touch('pack')} error={!!showErr('pack')} helperText={showErr('pack')} />
        </Grid>
      </Grid>

      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Pricing & reorder</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5, mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Purchase price (Rs.)" required fullWidth size="small" type="number" value={form.purchasePrice} onChange={set('purchasePrice')} onBlur={touch('purchasePrice')} error={!!showErr('purchasePrice')} helperText={showErr('purchasePrice')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Sale price (Rs.)" required fullWidth size="small" type="number" value={form.salePrice} onChange={set('salePrice')} onBlur={touch('salePrice')} error={!!showErr('salePrice')} helperText={showErr('salePrice')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Minimum stock (per branch)" required fullWidth size="small" type="number" value={form.minStock} onChange={set('minStock')} onBlur={touch('minStock')} error={!!showErr('minStock')} helperText={showErr('minStock')} />
        </Grid>
      </Grid>

      {!isEdit && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Opening stock · branch assignment</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Assign to branch" fullWidth size="small" value={form.branchId} onChange={set('branchId')}>
                {BRANCHES.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 2.5 }}>
              <TextField label="Quantity" required fullWidth size="small" type="number" value={form.qty} onChange={set('qty')} onBlur={touch('qty')} error={!!showErr('qty')} helperText={showErr('qty')} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2.75 }}>
              <TextField label="Batch no." required fullWidth size="small" value={form.batchNo} onChange={set('batchNo')} onBlur={touch('batchNo')} error={!!showErr('batchNo')} helperText={showErr('batchNo')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 2.75 }}>
              <TextField label="Expiry" required fullWidth size="small" type="date" value={form.expiry} onChange={set('expiry')} onBlur={touch('expiry')} error={!!showErr('expiry')} helperText={showErr('expiry')} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </Grid>
          <Stack sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Other branches start at zero and can receive stock through purchase orders or transfers.</Typography>
          </Stack>
        </>
      )}
    </FormDialog>
  )
}
