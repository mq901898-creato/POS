import { Box, Typography } from '@mui/material'
import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'Nothing to show', text = 'Try adjusting your filters.' }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
      <Inbox size={28} style={{ opacity: 0.5 }} />
      <Typography variant="h4" sx={{ mt: 1, color: 'text.primary' }}>{title}</Typography>
      <Typography variant="body2">{text}</Typography>
    </Box>
  )
}
