import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import { chartColors, palette } from '../../styles/theme'
import { formatCompactPKR, formatPKR } from '../../utils/format'

const axisStyle = { fontSize: 11, fill: palette.textMuted }

function TooltipBox({ active, payload, label, money = true }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${palette.border}`, borderRadius: 2, px: 1.5, py: 1, boxShadow: '0 6px 18px rgba(11,31,58,0.08)', minWidth: 150 }}>
      <Typography variant="caption" fontWeight={600} color="text.primary" mb={0.5} sx={{ display: 'block' }}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.dataKey} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.fill, display: 'inline-block' }} />
            {p.name}
          </Typography>
          <Typography variant="caption" fontWeight={600}>{money ? formatPKR(p.value) : p.value}</Typography>
        </Box>
      ))}
    </Box>
  )
}

/** Area / line trend chart. series: [{ key, label, color }] */
export function TrendChart({ data, xKey = 'label', series, height = 280, type = 'area', money = true }) {
  const Chart = type === 'line' ? LineChart : AreaChart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color || chartColors[i]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={s.color || chartColors[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={palette.border} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={68} tickFormatter={(v) => (money ? formatCompactPKR(v) : v)} />
        <Tooltip content={<TooltipBox money={money} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        {series.map((s, i) =>
          type === 'line' ? (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color || chartColors[i]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
          ) : (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color || chartColors[i]} strokeWidth={2} fill={`url(#g-${s.key}-${i})`} />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  )
}

/** Grouped vertical bars. series: [{ key, label, color }] */
export function CompareBarChart({ data, xKey = 'label', series, height = 260, money = true, layout = 'horizontal' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout === 'vertical' ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={palette.border} strokeDasharray="3 3" />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => (money ? formatCompactPKR(v) : v)} />
            <YAxis type="category" dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={68} tickFormatter={(v) => (money ? formatCompactPKR(v) : v)} />
          </>
        )}
        <Tooltip content={<TooltipBox money={money} />} cursor={{ fill: '#F1F5FA' }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color || chartColors[i]} radius={[4, 4, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Donut for share breakdowns. data: [{ name, value }] */
export function ShareDonut({ data, height = 220, money = true }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ width: 180, height, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map((d, i) => (
                <Cell key={d.name} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox money={money} />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ flex: 1, minWidth: 160 }}>
        {data.map((d, i) => (
          <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.6, gap: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: chartColors[i % chartColors.length] }} />
              {d.name}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round((d.value / total) * 100)}%
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{money ? formatCompactPKR(d.value) : d.value}</Typography>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
