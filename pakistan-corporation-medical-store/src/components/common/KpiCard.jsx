import { Card, Stack, Typography, Box } from '@mui/material'
import { palette } from '../../styles/theme'

export default function KpiCard({ label, value, hint, icon: Icon, tone = 'blue', delta }) {
  const tones = {
    blue: { c: palette.blue, bg: palette.blueSoft },
    teal: { c: palette.teal, bg: '#E3F4F4' },
    green: { c: palette.success, bg: palette.successSoft },
    amber: { c: palette.warning, bg: palette.warningSoft },
    red: { c: palette.danger, bg: palette.dangerSoft },
    navy: { c: palette.navy, bg: '#E4E9F2' },
  }
  const t = tones[tone]
  return (
    <Card sx={{ p: 2.25, height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5, letterSpacing: -0.3, color: palette.text, whiteSpace: 'nowrap' }}>{value}</Typography>
          {(hint || delta) && (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
              {delta && (
                <Typography variant="caption" fontWeight={600} sx={{ color: delta.startsWith('+') ? palette.success : palette.danger }}>{delta}</Typography>
              )}
              {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
            </Stack>
          )}
        </Box>
        {Icon && (
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: t.bg, color: t.c, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon size={18} />
          </Box>
        )}
      </Stack>
    </Card>
  )
}
