import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import { X } from 'lucide-react'

export default function FormDialog({ open, onClose, title, subtitle, children, onSave, saveLabel = 'Save', cancelLabel = 'Cancel', saveDisabled, maxWidth = 'sm', color = 'primary', danger }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth} slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle component="div" sx={{ pb: 1.5, pr: 6 }}>
        <Typography variant="h2">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
        <IconButton onClick={onClose} aria-label="Close" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Button color="inherit" onClick={onClose} sx={{ color: 'text.secondary' }}>{cancelLabel}</Button>
          {onSave && (
            <Button variant="contained" color={danger ? 'error' : color} onClick={onSave} disabled={saveDisabled}>{saveLabel}</Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
