import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { Printer, X } from 'lucide-react'
import { BRANCH_BY_ID } from '../../data/demoData'
import { fmtDateTime, formatPKR } from '../../utils/format'

/** Printable receipt preview (demo). Uses the .receipt style and the print-area class. */
export default function ReceiptDialog({ open, onClose, sale }) {
  if (!sale) return null
  const branch = BRANCH_BY_ID[sale.branchId]
  const subtotal = sale.items.reduce((s, it) => s + it.qty * it.price, 0)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, bgcolor: '#F3F5F9' } } }}>
      <DialogContent sx={{ p: 2.5 }}>
        <Box className="print-area receipt" sx={{ bgcolor: '#fff', p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
            <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>PAKISTAN CORPORATION MEDICAL STORE</Typography>
            <Typography sx={{ fontFamily: 'inherit', fontSize: 11.5 }}>{branch?.name} · {branch?.city}</Typography>
            <Typography sx={{ fontFamily: 'inherit', fontSize: 11 }}>Tax invoice · demonstration copy</Typography>
          </Box>
          <div className="receipt-dashed" />
          <Row k="Invoice" v={sale.id} />
          <Row k="Date" v={fmtDateTime(sale.createdAt)} />
          <Row k="Cashier" v={sale.cashier} />
          <Row k="Customer" v={sale.customerName} />
          <div className="receipt-dashed" />
          {sale.items.map((it) => (
            <Box key={it.medicineId + it.name} sx={{ mb: 0.75 }}>
              <Typography sx={{ fontFamily: 'inherit', fontSize: 12 }}>{it.name}</Typography>
              <Row k={`  ${it.qty} × ${it.price.toLocaleString('en-US')}`} v={(it.qty * it.price).toLocaleString('en-US')} />
            </Box>
          ))}
          <div className="receipt-dashed" />
          <Row k="Subtotal" v={subtotal.toLocaleString('en-US')} />
          {sale.discount > 0 && <Row k="Discount" v={`-${sale.discount.toLocaleString('en-US')}`} />}
          <Row k="TOTAL (PKR)" v={sale.total.toLocaleString('en-US')} bold />
          <div className="receipt-dashed" />
          <Row k="Payment" v={sale.payment} />
          {sale.status === 'Refunded' && <Row k="Refunded" v={`-${sale.refundAmount.toLocaleString('en-US')}`} />}
          <Typography sx={{ fontFamily: 'inherit', fontSize: 11, textAlign: 'center', mt: 2 }}>Thank you for choosing us · Get well soon</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
        <Button color="inherit" onClick={onClose} startIcon={<X size={15} />} sx={{ color: 'text.secondary' }}>Close</Button>
        <Button variant="contained" startIcon={<Printer size={15} />} onClick={() => window.print()}>Print receipt</Button>
      </DialogActions>
    </Dialog>
  )
}

function Row({ k, v, bold }) {
  return (
    <Stack direction="row" sx={{ fontFamily: 'inherit', fontSize: 12, fontWeight: bold ? 700 : 400, py: 0.2, justifyContent: 'space-between' }}>
      <span>{k}</span>
      <span>{v}</span>
    </Stack>
  )
}
