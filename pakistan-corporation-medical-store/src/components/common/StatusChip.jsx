import { Chip } from '@mui/material'
import { palette } from '../../styles/theme'

const TONES = {
  success: { color: palette.success, bg: palette.successSoft },
  warning: { color: palette.warning, bg: palette.warningSoft },
  danger: { color: palette.danger, bg: palette.dangerSoft },
  info: { color: palette.blue, bg: palette.blueSoft },
  neutral: { color: palette.textMuted, bg: '#EEF1F6' },
}

const STATUS_TONE = {
  Completed: 'success', Received: 'success', Online: 'success', 'In Stock': 'success', Paid: 'success', Synced: 'success', Active: 'success', Settled: 'success',
  Pending: 'warning', 'Pending Approval': 'warning', 'Partially Received': 'warning', 'Low Stock': 'warning', 'Expiring Soon': 'warning',
  Syncing: 'warning', 'Awaiting Dispatch': 'warning', Due: 'warning', Partial: 'warning', Ready: 'warning',
  Ordered: 'info', 'In Transit': 'info', 'In Billing': 'info', Sent: 'info',
  Refunded: 'danger', Expired: 'danger', 'Out of Stock': 'danger', Offline: 'danger', Rejected: 'danger', Overdue: 'danger',
  Cash: 'success', Card: 'info', 'Mobile Wallet': 'neutral', 'Bank Transfer': 'neutral',
}

export default function StatusChip({ status, tone, size = 'small' }) {
  const key = tone || STATUS_TONE[status] || 'neutral'
  const t = TONES[key]
  return (
    <Chip
      size={size}
      label={status}
      sx={{ color: t.color, bgcolor: t.bg, height: size === 'small' ? 22 : 26, fontSize: 12, '& .MuiChip-label': { px: 1 } }}
    />
  )
}
