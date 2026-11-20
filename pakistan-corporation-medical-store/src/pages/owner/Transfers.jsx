import { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { Send, PackageCheck, Truck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Panel from '../../components/common/Panel'
import StatusChip from '../../components/common/StatusChip'
import DataTable from '../../components/tables/DataTable'
import TransferDialog from '../../components/modals/TransferDialog'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, MEDICINE_BY_ID } from '../../data/demoData'
import { fmtDay } from '../../utils/format'

export default function Transfers() {
  const { state, dispatch, notify } = useDemo()
  const [open, setOpen] = useState(false)

  const available = (branchId, medicineId) => state.inventory.filter((r) => r.branchId === branchId && r.medicineId === medicineId).reduce((s, r) => s + r.qty, 0)

  const advance = (t) => {
    if (t.status === 'Awaiting Dispatch') {
      const avail = available(t.from, t.medicineId)
      if (avail < t.qty) {
        notify(`Cannot dispatch ${t.id}: ${BRANCH_BY_ID[t.from].name} has only ${avail} units`, 'danger')
        return
      }
      dispatch({ type: 'UPDATE_TRANSFER', id: t.id, status: 'In Transit' })
      notify(`${t.id} dispatched from ${BRANCH_BY_ID[t.from].name}`, 'info')
    } else if (t.status === 'In Transit') {
      dispatch({ type: 'UPDATE_TRANSFER', id: t.id, status: 'Received' })
      notify(`${t.id} received at ${BRANCH_BY_ID[t.to].name}; stock added`, 'success')
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Operations', 'Stock transfers']}
        title="Stock transfers"
        subtitle="Request stock moves between branches. Source stock is deducted on dispatch and added to the destination on receipt."
        actions={<Button variant="contained" startIcon={<Send size={15} />} onClick={() => setOpen(true)}>Request transfer</Button>}
      />

      <Panel title="Transfer register" subtitle="Requests, dispatches and receipts across all branches" noPad>
        <Box sx={{ p: 2 }}>
          <DataTable
            searchFields={(t) => [t.id, BRANCH_BY_ID[t.from].name, BRANCH_BY_ID[t.to].name, MEDICINE_BY_ID[t.medicineId]?.name, t.status]}
            searchPlaceholder="Search transfers…"
            columns={[
              { id: 'id', label: 'Transfer ID', render: (t) => <Typography variant="caption" fontWeight={600}>{t.id}</Typography> },
              { id: 'route', label: 'From → To', render: (t) => <span>{BRANCH_BY_ID[t.from].name} → {BRANCH_BY_ID[t.to].name}</span>, sortable: false },
              { id: 'med', label: 'Medicine', render: (t) => MEDICINE_BY_ID[t.medicineId]?.name, sortValue: (t) => MEDICINE_BY_ID[t.medicineId]?.name },
              { id: 'qty', label: 'Qty', align: 'right' },
              { id: 'date', label: 'Requested', render: (t) => fmtDay(t.date), sortValue: (t) => t.date },
              { id: 'by', label: 'Requested by', render: (t) => t.requestedBy },
              { id: 'status', label: 'Status', render: (t) => <StatusChip status={t.status} />, sortable: false },
              {
                id: 'action', label: '', sortable: false, align: 'right',
                render: (t) => {
                  if (t.status === 'Awaiting Dispatch') return <Button size="small" variant="outlined" startIcon={<Truck size={14} />} onClick={() => advance(t)}>Dispatch</Button>
                  if (t.status === 'In Transit') return <Button size="small" variant="outlined" color="success" startIcon={<PackageCheck size={14} />} onClick={() => advance(t)}>Mark received</Button>
                  return <Typography variant="caption" color="text.secondary">Completed</Typography>
                },
              },
            ]}
            rows={state.transfers}
          />
        </Box>
      </Panel>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2.5 }}>
        <Panel title="How transfers work" sx={{ flex: 1 }}>
          <Stack spacing={1.25} sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            <Typography variant="body2">1. A branch or the owner raises a request with quantity and medicine.</Typography>
            <Typography variant="body2">2. On dispatch, stock is deducted from the source branch's batches (soonest expiry first).</Typography>
            <Typography variant="body2">3. On receipt, the stock is added to the destination branch as a new batch that keeps the original expiry date.</Typography>
          </Stack>
        </Panel>
      </Stack>

      <TransferDialog
        open={open}
        onClose={() => setOpen(false)}
        inventory={state.inventory}
        defaultFrom="main"
        onSubmit={(t) => {
          dispatch({ type: 'CREATE_TRANSFER', transfer: t })
          notify(`Transfer ${t.id} requested: ${t.qty} × ${MEDICINE_BY_ID[t.medicineId].name}`, 'success')
          setOpen(false)
        }}
      />
    </>
  )
}
