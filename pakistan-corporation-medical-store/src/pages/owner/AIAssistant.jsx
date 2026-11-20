import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, Box, Button, Card, Chip, IconButton, Stack, TextField, Typography, InputAdornment } from '@mui/material'
import { Send, Sparkles, RotateCcw, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/tables/DataTable'
import { CompareBarChart, TrendChart } from '../../components/charts/Charts'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, BRANCH_BY_ID, MEDICINE_BY_ID, ANCHOR, toDayKey, addDays } from '../../data/demoData'
import { filterSales, summarize, dailySeries, monthlySeries, topMedicines, groupByBranch, isLowStock, isExpiringSoon, isExpired } from '../../utils/analytics'
import { daysFromAnchor, fmtDay, formatPKR, formatCompactPKR } from '../../utils/format'
import { palette } from '../../styles/theme'

const SUGGESTIONS = [
  { id: 'compare', q: "Compare today's sales with yesterday" },
  { id: 'topBranch', q: 'Which branch generated the highest revenue?' },
  { id: 'week', q: "Show last seven days' sales" },
  { id: 'topMed', q: 'Which medicines are selling the most?' },
  { id: 'expiry', q: 'Which medicines are about to expire?' },
  { id: 'lowBranch', q: 'Which branch has the most low-stock medicines?' },
  { id: 'monthly', q: 'Show monthly sales performance' },
]

const RULES = [
  [/compare|yesterday|versus|vs\.?\s/i, 'compare'],
  [/highest|top branch|best branch|revenue.*branch|branch.*revenue/i, 'topBranch'],
  [/seven|7\s*day|last week|week/i, 'week'],
  [/selling|best.?seller|top medicine|most sold|medicines.*most/i, 'topMed'],
  [/expir|about to expire/i, 'expiry'],
  [/low.?stock|low stock/i, 'lowBranch'],
  [/monthly|month|performance/i, 'monthly'],
]
const matchIntent = (text) => {
  const hit = RULES.find(([re]) => re.test(text))
  return hit ? hit[1] : 'fallback'
}

const pctChange = (a, b) => (b ? ((a - b) / b) * 100 : 0)

/** Builds a predefined response from live demo data. Each block is text, a chart or a table. */
function respond(id, { allSales, state }) {
  const today = toDayKey(ANCHOR)
  const yesterday = toDayKey(addDays(ANCHOR, -1))
  const shortName = (b) => b.name

  if (id === 'compare') {
    const t = summarize(filterSales(allSales, { from: today, to: today }))
    const y = summarize(filterSales(allSales, { from: yesterday, to: yesterday }))
    const perBranch = BRANCHES.map((b) => ({
      label: b.id === 'main' ? 'Main' : b.name.replace('Branch ', 'B'),
      name: b.name,
      today: Math.round(summarize(filterSales(allSales, { branchId: b.id, from: today, to: today })).gross),
      yesterday: Math.round(summarize(filterSales(allSales, { branchId: b.id, from: yesterday, to: yesterday })).gross),
    }))
    const lead = [...perBranch].sort((a, b) => b.today - a.today)[0]
    return {
      text: `Today's gross sales are ${formatPKR(t.gross)} across ${t.count} invoices, compared with ${formatPKR(y.gross)} yesterday. That is a ${pctChange(t.gross, y.gross) >= 0 ? 'rise' : 'fall'} of ${Math.abs(pctChange(t.gross, y.gross)).toFixed(1)}%. Net revenue after refunds is ${formatPKR(t.net)}. ${lead.name} leads today.`,
      blocks: [{ type: 'chart', kind: 'bar', data: perBranch, series: [{ key: 'today', label: 'Today', color: palette.blue }, { key: 'yesterday', label: 'Yesterday', color: '#B7C4D8' }], height: 240 }],
    }
  }

  if (id === 'topBranch') {
    const rows = groupByBranch(filterSales(allSales, { from: '2026-11-01', to: today })).sort((a, b) => b.net - a.net)
    const total = rows.reduce((s, r) => s + r.net, 0) || 1
    const top = rows[0]
    return {
      text: `${top.branch.name} generated the highest net revenue this month, at ${formatPKR(top.net)} (${Math.round((top.net / total) * 100)}% of the consolidated total). ${rows[rows.length - 1].branch.name} is lowest at ${formatPKR(rows[rows.length - 1].net)}. Figures cover 1–18 November.`,
      blocks: [
        { type: 'chart', kind: 'bar', data: rows.map((r) => ({ label: r.branch.name.replace('Branch ', 'B'), net: Math.round(r.net), profit: Math.round(r.profit) })), series: [{ key: 'net', label: 'Net revenue', color: palette.navy }, { key: 'profit', label: 'Est. profit', color: palette.teal }], height: 240 },
        {
          type: 'table',
          rows: rows.map((r, i) => ({ id: r.branch.id, rank: i + 1, name: r.branch.name, net: r.net, share: `${Math.round((r.net / total) * 100)}%`, status: r.branch.status })),
          columns: [
            { id: 'rank', label: '#', render: (r) => r.rank },
            { id: 'name', label: 'Branch', render: (r) => r.name },
            { id: 'net', label: 'Net revenue', align: 'right', render: (r) => formatPKR(r.net) },
            { id: 'share', label: 'Share', align: 'right', render: (r) => r.share },
          ],
        },
      ],
    }
  }

  if (id === 'week') {
    const series = dailySeries(allSales, 7)
    const sum = series.reduce((s, r) => s + r.sales, 0)
    const best = [...series].sort((a, b) => b.sales - a.sales)[0]
    return {
      text: `Over the last seven days (12–18 November) the consolidated business recorded ${formatPKR(sum)} in gross sales. The strongest day was ${best.label} at ${formatPKR(best.sales)}. Daily average is ${formatPKR(sum / 7)}.`,
      blocks: [{ type: 'chart', kind: 'trend', data: series, series: [{ key: 'sales', label: 'Gross sales', color: palette.blue }, { key: 'net', label: 'Net revenue', color: palette.teal }], height: 240 }],
    }
  }

  if (id === 'topMed') {
    const top = topMedicines(filterSales(allSales, { from: '2026-11-01', to: today }), 8)
    return {
      text: top.length
        ? `The best-selling medicine this month is ${top[0].name}, with ${top[0].qty} units and ${formatPKR(top[0].revenue)} in revenue. The top eight products account for most of the month's counter activity.`
        : 'No completed sales have been recorded this month yet.',
      blocks: [{
        type: 'table',
        rows: top.map((t, i) => ({ ...t, rank: i + 1, category: MEDICINE_BY_ID[t.medicineId]?.category })),
        columns: [
          { id: 'rank', label: '#', render: (r) => r.rank },
          { id: 'name', label: 'Medicine', render: (r) => <Typography variant="body2" fontWeight={600}>{r.name}</Typography> },
          { id: 'category', label: 'Category', render: (r) => r.category },
          { id: 'qty', label: 'Units', align: 'right', render: (r) => r.qty },
          { id: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatPKR(r.revenue) },
        ],
      }],
    }
  }

  if (id === 'expiry') {
    const rows = state.inventory
      .map((r) => ({ ...r, days: daysFromAnchor(r.expiry), med: MEDICINE_BY_ID[r.medicineId] }))
      .filter((r) => r.med && (isExpiringSoon(r) || isExpired(r)))
      .sort((a, b) => a.days - b.days)
    const expired = rows.filter((r) => r.days < 0).length
    return {
      text: rows.length
        ? `${rows.length} batches expire within 90 days or have already expired (${expired} expired). The table lists them soonest first with branch, batch and remaining quantity so that stock can be moved, promoted or written off.`
        : 'No batches are expiring within the next 90 days.',
      blocks: rows.length ? [{
        type: 'table',
        rows: rows.slice(0, 12),
        columns: [
          { id: 'med', label: 'Medicine', render: (r) => <Typography variant="body2" fontWeight={600}>{r.med.name}</Typography> },
          { id: 'branch', label: 'Branch', render: (r) => BRANCH_BY_ID[r.branchId].name },
          { id: 'batch', label: 'Batch', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.batchNo}</span> },
          { id: 'expiry', label: 'Expiry', render: (r) => fmtDay(r.expiry) },
          { id: 'qty', label: 'Qty', align: 'right', render: (r) => r.qty },
          { id: 'days', label: 'Status', render: (r) => (r.days < 0 ? <Chip size="small" color="error" label={`Expired ${Math.abs(r.days)}d`} /> : <Chip size="small" color="warning" label={`${r.days} days`} />) },
        ],
      }] : [],
    }
  }

  if (id === 'lowBranch') {
    const rows = BRANCHES.map((b) => {
      const low = state.inventory.filter((r) => r.branchId === b.id && isLowStock(r))
      return { label: b.name.replace('Branch ', 'B'), name: b.name, count: new Set(low.map((r) => r.medicineId)).size, batches: low.length }
    })
    const worst = [...rows].sort((a, b) => b.count - a.count)[0]
    return {
      text: `${worst.name} has the most low-stock medicines, with ${worst.count} medicines below their minimum level. Each branch is measured against its own stock, not a pooled total, so transfers may be needed before reordering.`,
      blocks: [{ type: 'chart', kind: 'bar', data: rows, series: [{ key: 'count', label: 'Low-stock medicines', color: palette.warning }], height: 240 }],
    }
  }

  if (id === 'monthly') {
    const months = monthlySeries(allSales).filter((r) => r.sales > 0)
    const last = months[months.length - 1]
    const ytd = months.reduce((s, r) => s + r.net, 0)
    const novSoFar = summarize(filterSales(allSales, { from: '2026-11-01', to: today })).gross
    const octSamePeriod = summarize(filterSales(allSales, { from: '2026-10-01', to: '2026-10-18' })).gross
    return {
      text: `Year-to-date net revenue is ${formatCompactPKR(ytd)}. November to date (1–18 Nov) is at ${formatCompactPKR(novSoFar)} gross, ${pctChange(novSoFar, octSamePeriod) >= 0 ? 'up' : 'down'} ${Math.abs(pctChange(novSoFar, octSamePeriod)).toFixed(1)}% on the same days of October. The month total for ${last.label.replace(' (MTD)', '')} is still in progress. January to August are summarised from monthly archives; September onward is detailed.`,
      blocks: [{ type: 'chart', kind: 'trend', data: months.map((r) => ({ label: r.label.replace(' 2026', ''), sales: Math.round(r.sales), profit: Math.round(r.profit) })), series: [{ key: 'sales', label: 'Gross sales', color: palette.blue }, { key: 'profit', label: 'Est. profit', color: palette.teal }], height: 240 }],
    }
  }

  return {
    text: 'I can answer questions about sales comparisons, branch revenue, the last seven days, best-selling medicines, expiring stock, low-stock branches and monthly performance. Try one of the suggested questions on the right.',
    blocks: [],
  }
}

function Block({ block }) {
  if (block.type === 'chart') {
    return (
      <Card sx={{ p: 2, mt: 1.5, boxShadow: 'none' }}>
        {block.kind === 'bar'
          ? <CompareBarChart data={block.data} series={block.series} height={block.height} money={block.series[0].key !== 'count' && block.series[0].key !== 'batches'} />
          : <TrendChart data={block.data} series={block.series} height={block.height} />}
      </Card>
    )
  }
  if (block.type === 'table') {
    return (
      <Box sx={{ mt: 1.5 }}>
        <DataTable dense rowsPerPage={5} columns={block.columns} rows={block.rows.map((r, i) => ({ id: r.id || r.medicineId || i, ...r }))} />
      </Box>
    )
  }
  return null
}

export default function AIAssistant() {
  const demo = useDemo()
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'ai',
      text: 'Good evening, Tariq. I am the AI Pharmacy Business Assistant. I can summarise sales, compare branches and flag stock that needs attention. This is a demonstration: answers are generated from the mock records in this prototype.',
      blocks: [],
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, thinking])

  const ask = (text) => {
    const q = text.trim()
    if (!q || thinking) return
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: q }])
    setInput('')
    setThinking(true)
    const intent = matchIntent(q)
    setTimeout(() => {
      const res = respond(intent, { allSales: demo.allSales, state: demo.state })
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'ai', ...res }])
      setThinking(false)
    }, 1400)
  }

  const reset = () => {
    setMessages((m) => m.slice(0, 1))
    setInput('')
  }

  const scopeNote = useMemo(() => 'Consolidated across five branches · demo data', [])

  return (
    <>
      <PageHeader
        breadcrumbs={['Owner', 'AI Pharmacy Business Assistant']}
        title="AI Pharmacy Business Assistant"
        subtitle="Owner-only analytics assistant. Ask about sales, branches, stock and expiry in plain language."
        actions={<Chip size="small" icon={<Sparkles size={14} />} label="Owner access only" sx={{ bgcolor: palette.blueSoft, color: palette.blue, fontWeight: 600 }} />}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 2.5, alignItems: 'start' }}>
        <Card sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', lg: 'calc(100vh - 210px)' }, minHeight: 560, overflow: 'hidden' }}>
          <Stack direction="row" sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${palette.border}`, justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: palette.navy, width: 34, height: 34 }}><Sparkles size={16} /></Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>Business Assistant</Typography>
                <Typography variant="caption" color="text.secondary">{scopeNote}</Typography>
              </Box>
            </Stack>
            <Button size="small" startIcon={<RotateCcw size={14} />} onClick={reset} color="inherit" sx={{ color: 'text.secondary' }}>New conversation</Button>
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 3 }, py: 2.5, bgcolor: '#FAFBFD' }}>
            <Stack spacing={2.5}>
              {messages.map((m) => (
                <Stack key={m.id} direction="row" spacing={1.5} sx={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                  {m.role === 'ai' && <Avatar sx={{ bgcolor: palette.blue, width: 30, height: 30, mt: 0.25 }}><Sparkles size={14} /></Avatar>}
                  <Box sx={{ maxWidth: { xs: '92%', md: '82%' }, minWidth: 0, flex: m.role === 'ai' ? 1 : 'unset' }}>
                    <Box sx={{ px: 2, py: 1.5, borderRadius: 2.5, bgcolor: m.role === 'user' ? palette.navy : '#fff', color: m.role === 'user' ? '#fff' : palette.text, border: m.role === 'user' ? 'none' : `1px solid ${palette.border}`, borderTopLeftRadius: m.role === 'ai' ? 4 : undefined, borderTopRightRadius: m.role === 'user' ? 4 : undefined }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.65 }}>{m.text}</Typography>
                    </Box>
                    {m.blocks?.map((b, i) => <Block key={i} block={b} />)}
                  </Box>
                  {m.role === 'user' && <Avatar sx={{ bgcolor: '#D9E2F0', color: palette.navy, width: 30, height: 30, mt: 0.25 }}><User size={14} /></Avatar>}
                </Stack>
              ))}
              {thinking && (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: palette.blue, width: 30, height: 30 }}><Sparkles size={14} /></Avatar>
                  <Box sx={{ px: 2, py: 1.25, borderRadius: 2.5, bgcolor: '#fff', border: `1px solid ${palette.border}` }}>
                    <Stack direction="row" spacing={0.6} sx={{ height: 18, alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: palette.blue, animation: 'pulseDot 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                      ))}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Generating demo response…</Typography>
                    </Stack>
                  </Box>
                </Stack>
              )}
              <div ref={endRef} />
            </Stack>
          </Box>

          <Box sx={{ p: 2, borderTop: `1px solid ${palette.border}`, bgcolor: '#fff' }}>
            <TextField
              fullWidth
              placeholder="Ask about sales, branches, medicines or expiry…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }}
              disabled={thinking}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => ask(input)} disabled={!input.trim() || thinking} aria-label="Send question" color="primary">
                        <Send size={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Card>

        <Stack spacing={2.5}>
          <Card sx={{ p: 2.25 }}>
            <Typography variant="h3" sx={{ mb: 1.25 }}>Suggested questions</Typography>
            <Stack spacing={1}>
              {SUGGESTIONS.map((s) => (
                <Button key={s.id} variant="outlined" color="inherit" onClick={() => ask(s.q)} disabled={thinking} sx={{ justifyContent: 'flex-start', textAlign: 'left', color: 'text.primary', borderColor: palette.border, py: 1, '&:hover': { borderColor: palette.blue, bgcolor: palette.blueSoft } }}>
                  {s.q}
                </Button>
              ))}
            </Stack>
          </Card>
          <Card sx={{ p: 2.25 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>About this assistant</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              Access is restricted to the owner. The Cashier and Sales Counter panels do not show this assistant. In production it would query branch servers through a secure reporting layer; in this prototype it uses predefined responses calculated from mock data.
            </Typography>
          </Card>
        </Stack>
      </Box>
    </>
  )
}
