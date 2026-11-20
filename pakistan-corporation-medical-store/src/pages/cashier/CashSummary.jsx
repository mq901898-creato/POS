import { useMemo, useState } from 'react'
import { Alert, Box, Button, Card, Grid, Stack, TextField, Typography, Chip } from '@mui/material'
import { Lock, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import KpiCard from '../../components/common/KpiCard'
import Panel from '../../components/common/Panel'
import { ShareDonut } from '../../components/charts/Charts'
import { useDemo } from '../../context/DemoContext'
import { BRANCH_BY_ID, ANCHOR, toDayKey } from '../../data/demoData'
import { filterSales, summarize } from '../../utils/analytics'
import { fmtDay, formatPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

export default function CashSummary() {
  const { allSales, session, notify } = useDemo()
  const today = toDayKey(ANCHOR)
  const branch = BRANCH_BY_ID[session.branchId]
  const [opening, setOpening] = useState('5000')
  const [counted, setCounted] = useState('')
  const [closed, setClosed] = useState(false)
  const [touched, setTouched] = useState(false)

  const s = useMemo(() => summarize(filterSales(allSales, { branchId: session.branchId, from: today, to: today })), [allSales, session.branchId, today])
  const cashRefunds = useMemo(() => filterSales(allSales, { branchId: session.branchId, from: today, to: today })
    .filter((x) => x.status === 'Refunded' && x.payment === 'Cash')
    .reduce((a, x) => a + x.refundAmount, 0), [allSales, session.branchId, today])

  const openingAmt = Number(opening) || 0
  const expected = openingAmt + s.cash - cashRefunds
  const countedAmt = Number(counted)
  const variance = counted === '' ? 0 : countedAmt - expected
  const countErr = touched && counted === '' ? 'Enter the counted cash' : ''

  const close = () => {
    setTouched(true)
    if (counted === '') return
    setClosed(true)
    notify(`Day closed for ${branch.name} · variance ${formatPKR(variance)}`, variance === 0 ? 'success' : 'warning')
  }

  return (
    <>
      <PageHeader
        breadcrumbs={['Cashier', 'Records', 'Daily cash summary']}
        title="Daily cash summary"
        subtitle={`${branch.name} · ${fmtDay(today)} · cash reconciliation for the drawer`}
        actions={closed ? <Chip icon={<CheckCircle2 size={14} />} label="Day closed" color="success" variant="outlined" /> : null}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2.5 }}>
        <KpiCard label="Gross sales" value={formatPKR(s.gross)} hint={`${s.count} invoices`} tone="blue" icon={Lock} />
        <KpiCard label="Cash sales" value={formatPKR(s.cash)} hint="Cash payments" tone="green" icon={Lock} />
        <KpiCard label="Card sales" value={formatPKR(s.card)} hint="Card terminal" tone="navy" icon={Lock} />
        <KpiCard label="Online payments" value={formatPKR(s.online)} hint="Wallet + bank transfer" tone="teal" icon={Lock} />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="Drawer reconciliation" subtitle="Expected cash = opening float + cash sales − cash refunds">
            <Stack spacing={1.25}>
              <Row k="Opening float" v={formatPKR(openingAmt)} />
              <Row k="Add: cash sales" v={formatPKR(s.cash)} />
              <Row k="Less: cash refunds" v={`- ${formatPKR(cashRefunds)}`} />
              <Row k="Expected cash in drawer" v={formatPKR(expected)} bold />
            </Stack>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Opening float (Rs.)" type="number" size="small" fullWidth value={opening} onChange={(e) => setOpening(e.target.value)} disabled={closed} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Counted cash (Rs.)" type="number" size="small" fullWidth value={counted} onChange={(e) => setCounted(e.target.value)} disabled={closed} error={!!countErr} helperText={countErr || ' '} />
              </Grid>
            </Grid>
            {counted !== '' && (
              <Alert severity={variance === 0 ? 'success' : Math.abs(variance) < 200 ? 'warning' : 'error'} sx={{ borderRadius: 2 }}>
                {variance === 0 ? 'Drawer balances exactly.' : `Variance of ${formatPKR(variance)} (${variance > 0 ? 'surplus' : 'shortage'}). Record a reason before closing.`}
              </Alert>
            )}
            <Button fullWidth variant="contained" disabled={closed} onClick={close} sx={{ mt: 2 }} startIcon={<Lock size={15} />}>
              {closed ? 'Day closed for this branch' : 'Close day'}
            </Button>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="Payment split" subtitle="Share of today's gross sales by method">
            <ShareDonut data={[{ name: 'Cash', value: s.cash }, { name: 'Card', value: s.card }, { name: 'Mobile wallet', value: s.wallet }, { name: 'Bank transfer', value: s.bank }]} />
          </Panel>
          <Card sx={{ p: 2.25, mt: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Demonstration only. In the live system the day's cash is locked against the branch server at close, and variances above the threshold are routed to the owner for review.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

function Row({ k, v, bold }) {
  return (
    <Stack direction="row" sx={{ py: 0.75, borderBottom: bold ? 'none' : `1px dashed ${palette.border}`, justifyContent: 'space-between' }}>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} color={bold ? 'text.primary' : 'text.secondary'}>{k}</Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 600}>{v}</Typography>
    </Stack>
  )
}
