import { useMemo, useState } from 'react'
import { Button, Typography } from '@mui/material'
import { Plus, Pencil, Phone } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Panel from '../../components/common/Panel'
import DataTable from '../../components/tables/DataTable'
import ActionMenu from '../../components/tables/ActionMenu'
import SupplierFormDialog from '../../components/modals/SupplierFormDialog'
import { useDemo } from '../../context/DemoContext'
import { formatPKR } from '../../utils/format'

export default function Suppliers() {
  const { state, dispatch, notify } = useDemo()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => state.suppliers.map((s) => {
    const pos = state.purchases.filter((p) => p.supplierId === s.id)
    const total = pos.reduce((a, p) => a + p.total, 0)
    const paid = pos.reduce((a, p) => a + p.paid, 0)
    return { ...s, orders: pos.length, total, paid, due: total - paid }
  }), [state.suppliers, state.purchases])

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'Procurement', 'Suppliers']}
        title="Supplier directory"
        subtitle="Approved distributors, payment terms and running balances."
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditing(null); setOpen(true) }}>Add supplier</Button>}
      />
      <Panel noPad>
        <div style={{ padding: 16 }}>
          <DataTable
            rowsPerPage={8}
            searchFields={(s) => [s.name, s.contact, s.city, s.phone]}
            searchPlaceholder="Search suppliers…"
            columns={[
              { id: 'name', label: 'Supplier', render: (s) => <div><Typography variant="body2" fontWeight={600}>{s.name}</Typography><Typography variant="caption" color="text.secondary">{s.id}</Typography></div> },
              { id: 'contact', label: 'Contact', render: (s) => <div><Typography variant="body2">{s.contact}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Phone size={11} /> {s.phone}</Typography></div>, sortValue: (s) => s.contact },
              { id: 'city', label: 'City', render: (s) => s.city },
              { id: 'terms', label: 'Terms', render: (s) => s.terms, sortable: false },
              { id: 'orders', label: 'POs', align: 'right', render: (s) => s.orders },
              { id: 'total', label: 'Total purchased', align: 'right', render: (s) => formatPKR(s.total), sortValue: (s) => s.total },
              { id: 'due', label: 'Balance due', align: 'right', render: (s) => <Typography variant="body2" fontWeight={600} color={s.due > 0 ? 'error.main' : 'success.main'}>{formatPKR(s.due)}</Typography>, sortValue: (s) => s.due },
              { id: 'actions', label: '', sortable: false, align: 'right', render: (s) => <ActionMenu items={[{ label: 'Edit supplier', icon: Pencil, onClick: () => { setEditing(s); setOpen(true) } }]} /> },
            ]}
            rows={rows}
          />
        </div>
      </Panel>
      <SupplierFormDialog
        open={open}
        onClose={() => setOpen(false)}
        supplier={editing}
        onSubmit={(s) => {
          if (editing) { dispatch({ type: 'UPDATE_SUPPLIER', supplier: s }); notify(`${s.name} updated`) }
          else { dispatch({ type: 'ADD_SUPPLIER', supplier: s }); notify(`${s.name} added to supplier directory`) }
          setOpen(false)
        }}
      />
    </>
  )
}
