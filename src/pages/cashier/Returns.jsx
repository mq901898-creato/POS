import { useMemo, useState } from 'react'
import { Alert, Box, Button, Card, Chip, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Search, Undo2, ReceiptText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import RefundDialog from '../../components/modals/RefundDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { localKey } from '../../utils/analytics'
import { fmtDateTime, fmtDay, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function Returns() {
  const { allSales, session, dispatch, notify } = useDemo()
  const [invoiceNo, setInvoiceNo] = useState('')
  const [found, setFound] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [refund, setRefund] = useState(null)

  const branchSales = useMemo(() => allSales.filter((s) => s.branchId === session.branchId), [allSales, session.branchId])
  const refunds = useMemo(() => branchSales.filter((s) => s.status === 'Refunded').slice(0, 30), [branchSales])
  const todayKey = toDayKey(ANCHOR)

  const lookup = () => {
    const q = invoiceNo.trim().toUpperCase()
    const sale = branchSales.find((s) => s.id.toUpperCase() === q)
    setFound(sale || null)
    setNotFound(!sale && q.length > 0)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={['Cashier', 'Records', 'Refunds & returns']}
        title="Refunds & returns"
        subtitle="Look up an invoice from this branch to process a full refund. Items return to branch stock."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h3" sx={{ mb: 0.5 }}>Find invoice</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter the invoice number printed on the receipt.</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth size="small" placeholder="e.g. PCMS-MN-20261118-001" value={invoiceNo}
                onChange={(e) => { setInvoiceNo(e.target.value); setNotFound(false) }}
                onKeyDown={(e) => e.key === 'Enter' && lookup()}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
              />
              <Button variant="contained" onClick={lookup} sx={{ flexShrink: 0 }}>Find</Button>
            </Stack>
            {notFound && <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>No invoice with that number exists at {BRANCH_BY_ID[session.branchId].name}.</Alert>}

            {found && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, border: `1px solid ${palette.border}`, bgcolor: '#FAFBFD' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={700}>{found.id}</Typography>
                  <StatusChip status={found.status} />
                </Stack>
                <Typography variant="caption" color="text.secondary">{fmtDateTime(found.createdAt)} · {found.customerName} · {found.payment}</Typography>
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  {found.items.map((it) => (
                    <Stack key={it.medicineId} direction="row" sx={{ fontSize: 13.5, justifyContent: 'space-between' }}>
                      <span>{it.name} × {it.qty}</span><span>{formatPKR(it.qty * it.price)}</span>
                    </Stack>
                  ))}
                </Stack>
                <Stack direction="row" sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${palette.border}`, fontWeight: 700, justifyContent: 'space-between' }}>
                  <span>Refund amount</span><span>{formatPKR(found.total)}</span>
                </Stack>
                <Button fullWidth variant="contained" color="error" startIcon={<Undo2 size={16} />} disabled={found.status === 'Refunded'} onClick={() => setRefund(found)} sx={{ mt: 2 }}>
                  {found.status === 'Refunded' ? 'Already refunded' : 'Process refund'}
                </Button>
              </Box>
            )}
          </Card>

          <Card sx={{ p: 2.5, mt: 2.5 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Return policy (demo)</Typography>
            <Stack spacing={0.75} sx={{ color: 'text.secondary', fontSize: 13.5 }}>
              <Typography variant="body2">• Refunds are allowed within the same trading day.</Typography>
              <Typography variant="body2">• Opened or temperature-sensitive items cannot be returned to stock.</Typography>
              <Typography variant="body2">• Each refund requires a reason for the audit trail.</Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Refund register" subtitle={`${refunds.length} refunded invoices at ${BRANCH_BY_ID[session.branchId].name}`} noPad>
            <Box sx={{ p: 2 }}>
              <DataTable
                dense
                rowsPerPage={8}
                emptyTitle="No refunds recorded"
                emptyText="Refunded invoices will appear here."
                columns={[
                  { id: 'id', label: 'Invoice', render: (s) => <Typography variant="caption" fontWeight={600}>{s.id}</Typography> },
                  { id: 'date', label: 'Date', render: (s) => fmtDay(localKey(s.createdAt)), sortable: false },
                  { id: 'reason', label: 'Reason', render: (s) => s.refundReason, sortable: false },
                  { id: 'amt', label: 'Refunded', align: 'right', render: (s) => formatPKR(s.refundAmount), sortValue: (s) => s.refundAmount },
                  { id: 'today', label: '', render: (s) => (localKey(s.createdAt) === todayKey ? <Chip size="small" label="Today" variant="outlined" /> : null), sortable: false },
                ]}
                rows={refunds}
              />
            </Box>
          </Panel>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, color: 'text.secondary', alignItems: 'center' }}>
            <ReceiptText size={14} />
            <Typography variant="caption">Refunds are logged against the original invoice and reflected in the owner's net revenue.</Typography>
          </Stack>
        </Grid>
      </Grid>

      <RefundDialog
        open={!!refund}
        onClose={() => setRefund(null)}
        sale={refund}
        onConfirm={(reason) => {
          dispatch({ type: 'REFUND_SALE', id: refund.id, reason })
          notify(`Refund processed for ${refund.id} · ${formatPKR(refund.total)}`, 'warning')
          setRefund(null)
          setFound(null)
          setInvoiceNo('')
        }}
      />
    </>
  )
}
