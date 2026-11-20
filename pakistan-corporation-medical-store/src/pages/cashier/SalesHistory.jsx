import { useMemo, useState } from 'react'
import { Box, Button, Chip, Drawer, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Eye, Receipt, Undo2, X, Calendar } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatusChip from '../../components/common/StatusChip'
import Panel from '../../components/common/Panel'
import DataTable from '../../components/tables/DataTable'
import ActionMenu from '../../components/tables/ActionMenu'
import ReceiptDialog from '../../components/modals/ReceiptDialog'
import RefundDialog from '../../components/modals/RefundDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { filterSales, summarize, localKey } from '../../utils/analytics'
import { fmtDateTime, fmtDay, fmtTime, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function SalesHistory() {
  const { allSales, session, dispatch, notify } = useDemo()
  const today = toDayKey(ANCHOR)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [payment, setPayment] = useState('All')
  const [status, setStatus] = useState('All')
  const [detail, setDetail] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [refund, setRefund] = useState(null)

  const list = useMemo(() => filterSales(allSales, { branchId: session.branchId, from, to }).filter((s) => {
    if (payment !== 'All' && s.payment !== payment) return false
    if (status !== 'All' && s.status !== status) return false
    return true
  }), [allSales, session.branchId, from, to, payment, status])
  const sum = summarize(list)
  const current = detail ? allSales.find((s) => s.id === detail) : null

  return (
    <>
      <PageHeader
        breadcrumbs={['Cashier', 'Records', 'Sales history']}
        title="Sales history"
        subtitle={`${BRANCH_BY_ID[session.branchId].name} · invoices from the selected period`}
      />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><Mini label="Invoices" value={list.length} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Mini label="Gross" value={formatPKR(sum.gross)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Mini label="Refunds" value={formatPKR(sum.refunds)} tone="danger" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Mini label="Net" value={formatPKR(sum.net)} tone="success" /></Grid>
      </Grid>

      <Panel noPad>
        <Box sx={{ p: 2 }}>
          <DataTable
            rowsPerPage={10}
            searchFields={(s) => [s.id, s.customerName, s.payment, s.status]}
            searchPlaceholder="Search invoice or customer…"
            toolbar={
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value || from)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
                <TextField size="small" type="date" label="To" value={to} onChange={(e) => setTo(e.target.value || to)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
                <TextField select size="small" label="Payment" value={payment} onChange={(e) => setPayment(e.target.value)} sx={{ minWidth: 150 }}>
                  {['All', 'Cash', 'Card', 'Bank Transfer', 'Mobile Wallet'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
                  {['All', 'Completed', 'Refunded'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <Chip size="small" icon={<Calendar size={13} />} label={`${fmtDay(from)} – ${fmtDay(to)}`} variant="outlined" />
              </Stack>
            }
            columns={[
              { id: 'id', label: 'Invoice', render: (s) => <Typography variant="caption" fontWeight={600}>{s.id}</Typography> },
              { id: 'when', label: 'Date & time', render: (s) => `${fmtDay(localKey(s.createdAt))} ${fmtTime(s.createdAt)}`, sortValue: (s) => s.createdAt },
              { id: 'customer', label: 'Customer', render: (s) => s.customerName },
              { id: 'items', label: 'Items', align: 'right', render: (s) => s.items.reduce((a, i) => a + i.qty, 0), sortable: false },
              { id: 'payment', label: 'Payment', render: (s) => <StatusChip status={s.payment} />, sortable: false },
              { id: 'total', label: 'Total', align: 'right', sortValue: (s) => s.total, render: (s) => formatPKR(s.total) },
              { id: 'status', label: 'Status', render: (s) => <StatusChip status={s.status} />, sortable: false },
              {
                id: 'actions', label: '', align: 'right', sortable: false,
                render: (s) => (
                  <ActionMenu items={[
                    { label: 'Transaction details', icon: Eye, onClick: () => setDetail(s.id) },
                    { label: 'View receipt', icon: Receipt, onClick: () => setReceipt(s) },
                    { divider: true },
                    { label: 'Refund / return', icon: Undo2, danger: true, onClick: () => setRefund(s) },
                  ]} />
                ),
              },
            ]}
            rows={list}
          />
        </Box>
      </Panel>

      <Drawer anchor="right" open={!!current} onClose={() => setDetail(null)} slotProps={{ paper: { sx: { width: { xs: '100%', md: 480 } } } }}>
        {current && (
          <Box>
            <Stack direction="row" sx={{ p: 2.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Transaction</Typography>
                <Typography variant="h2">{current.id}</Typography>
                <Typography variant="body2" color="text.secondary">{fmtDateTime(current.createdAt)}</Typography>
              </Box>
              <IconButton onClick={() => setDetail(null)} aria-label="Close drawer"><X size={18} /></IconButton>
            </Stack>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <StatusChip status={current.status} />
                <StatusChip status={current.payment} />
              </Stack>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6 }}><Small k="Customer" v={current.customerName} /></Grid>
                <Grid size={{ xs: 6 }}><Small k="Cashier" v={current.cashier} /></Grid>
                <Grid size={{ xs: 6 }}><Small k="Branch" v={BRANCH_BY_ID[current.branchId].name} /></Grid>
                <Grid size={{ xs: 6 }}><Small k="Payment" v={current.payment} /></Grid>
              </Grid>
              <Box sx={{ border: `1px solid ${palette.border}`, borderRadius: 2, overflow: 'hidden' }}>
                {current.items.map((it) => (
                  <Stack key={it.medicineId} direction="row" sx={{ px: 2, py: 1.1, borderBottom: `1px solid ${palette.border}`, fontSize: 13.5, justifyContent: 'space-between' }}>
                    <span>{it.name} <Typography component="span" variant="caption" color="text.secondary">× {it.qty} @ {formatPKR(it.price)}</Typography></span>
                    <span>{formatPKR(it.qty * it.price)}</span>
                  </Stack>
                ))}
                <Stack direction="row" sx={{ px: 2, py: 1, justifyContent: 'space-between' }}><span>Discount</span><span>- {formatPKR(current.discount)}</span></Stack>
                <Stack direction="row" sx={{ px: 2, py: 1.25, bgcolor: '#F6F8FB', fontWeight: 700, justifyContent: 'space-between' }}><span>Total</span><span>{formatPKR(current.total)}</span></Stack>
              </Box>
              {current.status === 'Refunded' && (
                <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>Refunded {formatPKR(current.refundAmount)} · {current.refundReason}</Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                <Button variant="contained" startIcon={<Receipt size={15} />} onClick={() => setReceipt(current)}>View receipt</Button>
                {current.status === 'Completed' && <Button color="error" variant="outlined" startIcon={<Undo2 size={15} />} onClick={() => setRefund(current)}>Refund</Button>}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <ReceiptDialog open={!!receipt} onClose={() => setReceipt(null)} sale={receipt} />
      <RefundDialog
        open={!!refund}
        onClose={() => setRefund(null)}
        sale={refund}
        onConfirm={(reason) => {
          dispatch({ type: 'REFUND_SALE', id: refund.id, reason })
          notify(`Refund of ${formatPKR(refund.total)} processed for ${refund.id}; stock returned`, 'warning')
          setRefund(null)
          setDetail(null)
        }}
      />
    </>
  )
}

function Mini({ label, value, tone }) {
  const c = tone === 'danger' ? palette.danger : tone === 'success' ? palette.success : palette.text
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${palette.border}` }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={700} sx={{ fontSize: 19, color: c }}>{value}</Typography>
    </Box>
  )
}
function Small({ k, v }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{k}</Typography>
      <Typography variant="body2" fontWeight={600}>{v}</Typography>
    </Box>
  )
}
