import { useMemo, useState } from 'react'
import { Box, Button, Stack, Typography, Chip } from '@mui/material'
import { XCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatusChip from '../../components/common/StatusChip'
import Panel from '../../components/common/Panel'
import DataTable from '../../components/tables/DataTable'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID } from '../../data/demoData'
import { fmtDateTime, formatPKR } from '../../utils/format'

export default function Orders() {
  const { state, dispatch, notify, session } = useDemo()
  const [filter, setFilter] = useState('All')
  const branch = BRANCH_BY_ID[session.branchId]
  const orders = useMemo(() => state.orders.filter((o) => o.branchId === session.branchId), [state.orders, session.branchId])
  const counts = {
    Pending: orders.filter((o) => o.status === 'Pending').length,
    'In Billing': orders.filter((o) => o.status === 'In Billing').length,
    Completed: orders.filter((o) => o.status === 'Completed').length,
    Cancelled: orders.filter((o) => o.status === 'Cancelled').length,
  }
  const rows = orders.filter((o) => filter === 'All' || o.status === filter)

  return (
    <>
      <PageHeader
        breadcrumbs={['Sales counter', 'Counter', 'My orders']}
        title="My orders"
        subtitle={`${branch.name} · orders you prepared and their progress at billing`}
      />

      <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2.5, flexWrap: 'wrap' }}>
        {['All', 'Pending', 'In Billing', 'Completed', 'Cancelled'].map((s) => (
          <Chip
            key={s}
            onClick={() => setFilter(s)}
            label={s === 'All' ? `All · ${orders.length}` : `${s} · ${counts[s]}`}
            color={filter === s ? 'primary' : 'default'}
            variant={filter === s ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        ))}
      </Stack>

      <Panel noPad>
        <Box sx={{ p: 2 }}>
          <DataTable
            rowsPerPage={10}
            searchFields={(o) => [o.id, o.customerName, o.status, o.items.map((i) => i.name).join(' ')]}
            searchPlaceholder="Search order, customer or medicine…"
            defaultSort={{ id: 'createdAt', dir: 'desc' }}
            columns={[
              { id: 'id', label: 'Order', render: (o) => <Typography variant="caption" fontWeight={700}>{o.id}</Typography> },
              { id: 'createdAt', label: 'Created', render: (o) => fmtDateTime(o.createdAt), sortValue: (o) => o.createdAt },
              { id: 'customerName', label: 'Customer', render: (o) => o.customerName },
              {
                id: 'items', label: 'Items', sortable: false,
                render: (o) => (
                  <Box sx={{ maxWidth: 360 }}>
                    {o.items.map((i) => (
                      <Typography key={i.medicineId} variant="caption" noWrap sx={{ display: 'block' }}>{i.qty} × {i.name}</Typography>
                    ))}
                  </Box>
                ),
              },
              { id: 'value', label: 'Est. value', align: 'right', sortValue: (o) => o.items.reduce((s, i) => s + i.qty * i.price, 0), render: (o) => formatPKR(o.items.reduce((s, i) => s + i.qty * i.price, 0)) },
              { id: 'status', label: 'Status', sortable: false, render: (o) => <StatusChip status={o.status} /> },
              {
                id: 'invoice', label: 'Invoice', sortable: false,
                render: (o) => (o.invoice ? <Typography variant="caption" fontWeight={600}>{o.invoice}</Typography> : <Typography variant="caption" color="text.secondary">—</Typography>),
              },
              {
                id: 'actions', label: '', sortable: false, align: 'right',
                render: (o) => o.status === 'Pending' ? (
                  <Button
                    size="small" color="error" startIcon={<XCircle size={14} />}
                    onClick={() => { dispatch({ type: 'SET_ORDER_STATUS', id: o.id, status: 'Cancelled' }); notify(`${o.id} cancelled before billing`, 'warning') }}
                  >
                    Cancel
                  </Button>
                ) : null,
              },
            ]}
            rows={rows}
            emptyTitle="No orders in this view"
            emptyText="Orders you send to the cashier will appear here."
          />
        </Box>
      </Panel>
    </>
  )
}
