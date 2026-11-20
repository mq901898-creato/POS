import { Alert, Stack } from '@mui/material'
import { useDemo } from '../../context/DemoContext'

export default function Toaster() {
  const { toasts, dismissToast } = useDemo()
  return (
    <Stack spacing={1} sx={{ position: 'fixed', right: 20, bottom: 20, zIndex: 2000, maxWidth: 380 }}>
      {toasts.map((t) => (
        <Alert key={t.id} severity={t.tone === 'danger' ? 'error' : t.tone === 'warning' ? 'warning' : t.tone === 'info' ? 'info' : 'success'} variant="filled" onClose={() => dismissToast(t.id)} sx={{ boxShadow: '0 8px 24px rgba(11,31,58,0.18)', borderRadius: 2 }}>
          {t.text}
        </Alert>
      ))}
    </Stack>
  )
}
