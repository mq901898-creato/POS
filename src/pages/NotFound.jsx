import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
      <Box>
        <Typography variant="h1">Page not found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>This screen does not exist in the demo.</Typography>
        <Button component={RouterLink} to="/" variant="contained">Return to panel selection</Button>
      </Box>
    </Box>
  )
}
