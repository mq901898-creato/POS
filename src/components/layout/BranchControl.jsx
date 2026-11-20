import { Box, Chip, MenuItem, Select, Stack, Typography } from '@mui/material'
import { Building2 } from 'lucide-react'
import { BRANCHES, BRANCH_BY_ID } from '../../data/demoData'
import { palette } from '../../styles/theme'

export const statusColor = (s) => (s === 'Online' ? palette.success : s === 'Syncing' ? palette.warning : palette.danger)

export function StatusDot({ status }) {
  return <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor(status), display: 'inline-block', flexShrink: 0 }} />
}

/** Owner: consolidated view or one branch */
export function OwnerBranchSelect({ value, onChange }) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 240, bgcolor: '#fff', fontSize: 13.5, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}
      renderValue={(v) => {
        const b = BRANCH_BY_ID[v]
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {b ? <StatusDot status={b.status} /> : <Building2 size={15} color={palette.blue} />}
            <Typography variant="body2" fontWeight={600}>{b ? b.name : 'Consolidated · All branches'}</Typography>
          </Stack>
        )
      }}
    >
      <MenuItem value="all">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Building2 size={15} color={palette.blue} />
          <span>Consolidated · All branches</span>
        </Stack>
      </MenuItem>
      {BRANCHES.map((b) => (
        <MenuItem key={b.id} value={b.id}>
          <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
            <StatusDot status={b.status} />
            <span>{b.name}</span>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', pl: 2 }}>{b.city}</Typography>
          </Stack>
        </MenuItem>
      ))}
    </Select>
  )
}

/** Cashier / sales counter: fixed to the assigned branch */
export function AssignedBranchChip({ branchId }) {
  const b = BRANCH_BY_ID[branchId]
  if (!b) return null
  return (
    <Chip
      icon={<StatusDot status={b.status} />}
      label={
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <span>{b.name}</span>
          <Typography component="span" variant="caption" color="text.secondary">· {b.status}</Typography>
        </Stack>
      }
      sx={{ bgcolor: '#fff', border: `1px solid ${palette.border}`, height: 34, px: 0.5, '& .MuiChip-icon': { ml: 1 } }}
    />
  )
}
