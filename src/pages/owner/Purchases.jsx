import { useMemo, useState } from 'react'
import { Box, Button, Chip, Drawer, Grid, IconButton, LinearProgress, Stack, Tab, Tabs, Typography, Divider } from '@mui/material'
import { Plus, CheckCircle2, PackageCheck, Wallet, Eye, X } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import StatusChip from '../../components/common/StatusChip'
import Panel from '../../components/common/Panel'
import DataTable from '../../components/tables/DataTable'
import ActionMenu from '../../components/tables/ActionMenu'
import PurchaseOrderDialog from '../../components/modals/PurchaseOrderDialog'
import RecordPaymentDialog from '../../components/modals/RecordPaymentDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, SUPPLIER_BY_ID, MEDICINE_BY_ID } from '../../data/demoData'
import { fmtDay, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

const payTone = (p) => (p.paid >= p.total ? 'Paid' : p.paid > 0 ? 'Partial' : 'Due')

export default function Purchases() {
  const { state, dispatch, notify, session } = useDemo()
  const [tab, setTab] = useState('orders')
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(null)
  const [detail, setDetail] = useState(null)

  const pos = useMemo(() => state.purchases.map((p) => ({ ...p, due: p.total - p.paid })), [state.purchases])
  const openPayables = pos.reduce((s, p) => s + p.due, 0)
  const pendingApproval = pos.filter((p) => p.status === 'Pending Approval').length
  const inTransit = pos.filter((p) => p.status === 'Ordered' || p.status === 'Partially Received').length
  const detailPo = pos.find((p) => p.id === detail)

  const approve = (p) => { dispatch({ type: 'APPROVE_PO', id: p.id }); notify(`${p.id} approved and sent to ${SUPPLIER_BY_ID[p.supplierId].name}`) }
  const receive = (p) => { dispatch({ type: 'RECEIVE_PO', id: p.id }); notify(`${p.id} received at ${BRANCH_BY_ID[p.branchId].name}; stock added as new batches`) }

  const actionsFor = (p) => [
    { label: 'View details', icon: Eye, onClick: () => setDetail(p.id) },
    ...(p.status === 'Pending Approval' ? [{ label: 'Approve order', icon: CheckCircle2, onClick: () => approve(p) }] : []),
    ...(p.status === 'Ordered' || p.status === 'Partially Received' ? [{ label: 'Receive stock (GRN)', icon: PackageCheck, onClick: () => receive(p) }] : []),
    ...(p.due > 0 ? [{ label: 'Record payment', icon: Wallet, onClick: () => setPaying(p.id) }] : []),
  ]

  const orderColumns = [
    { id: 'id', label: 'PO no.', render: (p) => <Typography variant="caption" fontWeight={700}>{p.id}</Typography> },
    { id: 'supplier', label: 'Supplier', render: (p) => SUPPLIER_BY_ID[p.supplierId].name, sortValue: (p) => SUPPLIER_BY_ID[p.supplierId].name },
    { id: 'branch', label: 'Deliver to', render: (p) => BRANCH_BY_ID[p.branchId].name, sortable: false },
    { id: 'orderDate', label: 'Ordered', render: (p) => fmtDay(p.orderDate), sortValue: (p) => p.orderDate },
    { id: 'expectedDate', label: 'Expected', render: (p) => fmtDay(p.expectedDate), sortValue: (p) => p.expectedDate },
    { id: 'items', label: 'Lines', align: 'right', render: (p) => p.items.length, sortable: false },
    { id: 'total', label: 'Total', align: 'right', render: (p) => formatPKR(p.total), sortValue: (p) => p.total },
    { id: 'due', label: 'Balance due', align: 'right', render: (p) => <Typography variant="body2" color={p.due > 0 ? 'error.main' : 'success.main'} fontWeight={600}>{formatPKR(p.due)}</Typography>, sortValue: (p) => p.due },
    { id: 'pay', label: 'Payment', render: (p) => <StatusChip status={payTone(p)} />, sortable: false },
    { id: 'status', label: 'Status', render: (p) => <StatusChip status={p.status} />, sortable: false },
    { id: 'actions', label: '', sortable: false, align: 'right', render: (p) => <ActionMenu items={actionsFor(p)} /> },
  ]

  const receivedRows = useMemo(() => state.purchases
    .filter((p) => p.status === 'Received' || p.status === 'Partially Received')
    .flatMap((p) => p.items.filter((it) => it.received > 0).map((it) => ({
      id: `${p.id}-${it.medicineId}`, po: p.id, medicine: MEDICINE_BY_ID[it.medicineId]?.name || it.name, branch: BRANCH_BY_ID[p.branchId].name,
      ordered: it.qty, received: it.received, unitCost: it.unitCost, value: it.received * it.unitCost, status: p.status, date: p.receivedOn || p.orderDate, supplier: SUPPLIER_BY_ID[p.supplierId].name,
    }))), [state.purchases])

  const paymentRows = useMemo(() => state.purchases.flatMap((p) => p.paymentHistory.map((h, i) => ({
    id: `${p.id}-${i}`, date: h.date, po: p.id, supplier: SUPPLIER_BY_ID[p.supplierId].name, amount: h.amount, method: h.method,
  }))).sort((a, b) => (a.date < b.date ? 1 : -1)), [state.purchases])

  const supplierBalances = useMemo(() => state.suppliers.map((s) => {
    const list = pos.filter((p) => p.supplierId === s.id)
    return { id: s.id, name: s.name, orders: list.length, total: list.reduce((a, p) => a + p.total, 0), paid: list.reduce((a, p) => a + p.paid, 0), due: list.reduce((a, p) => a + p.due, 0) }
  }).filter((r) => r.orders > 0).sort((a, b) => b.due - a.due), [state.suppliers, pos])

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Procurement', 'Purchases']}
        title="Purchase management"
        subtitle="Purchase orders, goods receipt into branch stock, and supplier payables."
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreating(true)}>New purchase order</Button>}
      />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Purchase orders" value={pos.length} hint={`${pendingApproval} awaiting approval`} tone="blue" icon={Eye} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Open deliveries" value={inTransit} hint="Ordered or partly received" tone="amber" icon={PackageCheck} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total purchased" value={formatPKR(pos.reduce((s, p) => s + p.total, 0))} tone="navy" icon={Wallet} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Payables outstanding" value={formatPKR(openPayables)} tone="red" icon={Wallet} /></Grid>
      </Grid>

      <Panel noPad contentSx={{ p: 0 }}>
        <Box sx={{ px: 2, borderBottom: `1px solid ${palette.border}` }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 46 }}>
            <Tab value="orders" label="Purchase orders" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="history" label="Purchase history" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="received" label="Received stock" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
            <Tab value="payments" label="Supplier payments" sx={{ minHeight: 46, textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>
        <Box sx={{ p: 2 }}>
          {tab === 'orders' && (
            <DataTable
              rowsPerPage={8}
              searchFields={(p) => [p.id, SUPPLIER_BY_ID[p.supplierId].name, BRANCH_BY_ID[p.branchId].name, p.status]}
              searchPlaceholder="Search PO, supplier, branch…"
              columns={orderColumns}
              rows={pos.filter((p) => p.status !== 'Received')}
              emptyTitle="No open purchase orders"
            />
          )}
          {tab === 'history' && (
            <DataTable
              rowsPerPage={8}
              searchFields={(p) => [p.id, SUPPLIER_BY_ID[p.supplierId].name, BRANCH_BY_ID[p.branchId].name, p.status]}
              searchPlaceholder="Search purchase history…"
              defaultSort={{ id: 'orderDate', dir: 'desc' }}
              columns={orderColumns}
              rows={pos}
            />
          )}
          {tab === 'received' && (
            <DataTable
              rowsPerPage={8}
              searchFields={(r) => [r.medicine, r.branch, r.po, r.supplier]}
              searchPlaceholder="Search received stock…"
              columns={[
                { id: 'po', label: 'PO', render: (r) => <Typography variant="caption" fontWeight={600}>{r.po}</Typography> },
                { id: 'medicine', label: 'Medicine', render: (r) => <Typography variant="body2" fontWeight={600}>{r.medicine}</Typography> },
                { id: 'supplier', label: 'Supplier', render: (r) => r.supplier, sortable: false },
                { id: 'branch', label: 'Branch', render: (r) => r.branch, sortable: false },
                { id: 'ordered', label: 'Ordered', align: 'right', render: (r) => r.ordered },
                { id: 'received', label: 'Received', align: 'right', render: (r) => r.received },
                { id: 'unitCost', label: 'Unit cost', align: 'right', render: (r) => formatPKR(r.unitCost) },
                { id: 'value', label: 'Value', align: 'right', render: (r) => formatPKR(r.value), sortValue: (r) => r.value },
                { id: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} />, sortable: false },
              ]}
              rows={receivedRows}
            />
          )}
          {tab === 'payments' && (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Typography variant="h3" sx={{ mb: 1.25 }}>Payables by supplier</Typography>
                <Stack spacing={1.25}>
                  {supplierBalances.map((s) => (
                    <Box key={s.id} sx={{ p: 1.5, border: `1px solid ${palette.border}`, borderRadius: 2 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                        <Typography variant="body2" fontWeight={700} color={s.due > 0 ? 'error.main' : 'success.main'}>{formatPKR(s.due)}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={s.total ? (s.paid / s.total) * 100 : 0} sx={{ my: 1, height: 5, borderRadius: 3, bgcolor: '#EEF2F8', '& .MuiLinearProgress-bar': { bgcolor: palette.success } }} />
                      <Typography variant="caption" color="text.secondary">{s.orders} orders · {formatPKR(s.paid)} paid of {formatPKR(s.total)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Typography variant="h3" sx={{ mb: 1.25 }}>Payment records</Typography>
                <DataTable
                  dense
                  rowsPerPage={8}
                  emptyTitle="No payments recorded"
                  emptyText="Use “Record payment” on a purchase order to add one."
                  columns={[
                    { id: 'date', label: 'Date', render: (r) => fmtDay(r.date), sortValue: (r) => r.date },
                    { id: 'po', label: 'PO', render: (r) => r.po, sortable: false },
                    { id: 'supplier', label: 'Supplier', render: (r) => r.supplier, sortable: false },
                    { id: 'method', label: 'Method', render: (r) => r.method, sortable: false },
                    { id: 'amount', label: 'Amount', align: 'right', render: (r) => formatPKR(r.amount), sortValue: (r) => r.amount },
                  ]}
                  rows={paymentRows}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Panel>

      <PurchaseOrderDialog
        open={creating}
        onClose={() => setCreating(false)}
        defaultBranch={session.branchId && session.branchId !== 'all' ? session.branchId : 'main'}
        onSubmit={(po) => {
          dispatch({ type: 'CREATE_PO', po })
          notify(`${po.id} created for ${formatPKR(po.total)} · awaiting approval`, 'info')
          setCreating(false)
        }}
      />

      <RecordPaymentDialog
        open={!!paying}
        onClose={() => setPaying(null)}
        po={pos.find((p) => p.id === paying)}
        onSubmit={({ amount, method }) => {
          dispatch({ type: 'RECORD_PAYMENT', id: paying, amount, method })
          notify(`Payment of ${formatPKR(amount)} recorded for ${paying}`)
          setPaying(null)
        }}
      />

      <Drawer anchor="right" open={!!detailPo} onClose={() => setDetail(null)} slotProps={{ paper: { sx: { width: { xs: '100%', md: 620 } } } }}>
        {detailPo && (
          <Box>
            <Stack direction="row" sx={{ p: 2.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Purchase order</Typography>
                <Typography variant="h2">{detailPo.id}</Typography>
                <Typography variant="body2" color="text.secondary">{SUPPLIER_BY_ID[detailPo.supplierId].name} · {SUPPLIER_BY_ID[detailPo.supplierId].terms} terms</Typography>
              </Box>
              <IconButton onClick={() => setDetail(null)} aria-label="Close drawer"><X size={18} /></IconButton>
            </Stack>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <StatusChip status={detailPo.status} />
                <StatusChip status={payTone(detailPo)} />
              </Stack>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {[
                  ['Deliver to', BRANCH_BY_ID[detailPo.branchId].name], ['Ordered', fmtDay(detailPo.orderDate)],
                  ['Expected', fmtDay(detailPo.expectedDate)], ['Total', formatPKR(detailPo.total)],
                  ['Paid', formatPKR(detailPo.paid)], ['Balance due', formatPKR(detailPo.due)],
                ].map(([k, v]) => (
                  <Grid key={k} size={{ xs: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{k}</Typography>
                    <Typography variant="body2" fontWeight={600}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="h3" sx={{ mb: 1 }}>Items</Typography>
              <Box sx={{ border: `1px solid ${palette.border}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
                {detailPo.items.map((it) => (
                  <Stack key={it.medicineId} direction="row" sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${palette.border}`, '&:last-child': { borderBottom: 0 }, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{MEDICINE_BY_ID[it.medicineId]?.name || it.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{it.received} of {it.qty} received · {formatPKR(it.unitCost)} / unit</Typography>
                    </Box>
                    <Typography fontWeight={600}>{formatPKR(it.qty * it.unitCost)}</Typography>
                  </Stack>
                ))}
              </Box>
              <Typography variant="h3" sx={{ mb: 1 }}>Payments</Typography>
              {detailPo.paymentHistory.length === 0 && <Typography variant="body2" color="text.secondary">No payments yet.</Typography>}
              {detailPo.paymentHistory.map((h, i) => (
                <Stack key={i} direction="row" sx={{ py: 0.75, justifyContent: 'space-between' }}>
                  <Typography variant="body2">{fmtDay(h.date)} · {h.method}</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatPKR(h.amount)}</Typography>
                </Stack>
              ))}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1}>
                {detailPo.status === 'Pending Approval' && <Button variant="contained" onClick={() => approve(detailPo)}>Approve order</Button>}
                {(detailPo.status === 'Ordered' || detailPo.status === 'Partially Received') && <Button variant="contained" color="success" onClick={() => receive(detailPo)}>Receive stock</Button>}
                {detailPo.due > 0 && <Button variant="outlined" onClick={() => setPaying(detailPo.id)}>Record payment</Button>}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  )
}
