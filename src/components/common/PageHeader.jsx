import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import { ChevronRight } from 'lucide-react'

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}>
      <Box>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs separator={<ChevronRight size={13} />} sx={{ mb: 0.5, fontSize: 12, color: 'text.secondary' }}>
            {breadcrumbs.map((b) => (
              <Typography key={b} variant="caption" color="text.secondary">{b}</Typography>
            ))}
          </Breadcrumbs>
        )}
        <Typography variant="h1" component="h1">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>{actions}</Stack>}
    </Stack>
  )
}
