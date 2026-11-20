import { Card, CardContent, CardHeader, Typography, Box } from '@mui/material'

export default function Panel({ title, subtitle, action, children, sx, contentSx, noPad }) {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
      {(title || action) && (
        <CardHeader
          sx={{ pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center', m: 0 } }}
          title={<Typography variant="h3">{title}</Typography>}
          subheader={subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          action={action}
        />
      )}
      <CardContent sx={{ pt: title ? 1 : 2, px: noPad ? 0 : 2, pb: noPad ? 0 : 2, '&:last-child': { pb: noPad ? 0 : 2 }, flex: 1, ...contentSx }}>
        <Box sx={{ height: '100%' }}>{children}</Box>
      </CardContent>
    </Card>
  )
}
