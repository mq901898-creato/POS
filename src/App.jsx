import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './styles/theme'
import { DemoProvider } from './context/DemoContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DemoProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DemoProvider>
    </ThemeProvider>
  )
}
