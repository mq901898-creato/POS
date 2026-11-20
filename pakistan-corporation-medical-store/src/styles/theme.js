import { createTheme } from '@mui/material/styles'

export const palette = {
  navy: '#0B1F3A',
  navyLight: '#16315A',
  blue: '#1F5FBF',
  blueSoft: '#E8F0FB',
  bg: '#F3F5F9',
  card: '#FFFFFF',
  border: '#E3E8F0',
  text: '#1E2A3B',
  textMuted: '#6B7789',
  success: '#12A150',
  successSoft: '#E6F6EC',
  warning: '#D98E04',
  warningSoft: '#FDF3E0',
  danger: '#D92D20',
  dangerSoft: '#FDE8E6',
  teal: '#0E8A8A',
}

// Chart series colors (muted, professional)
export const chartColors = ['#1F5FBF', '#0E8A8A', '#D98E04', '#7A5AF8', '#D92D20', '#6B7789']

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.navy, contrastText: '#fff' },
    secondary: { main: palette.blue },
    success: { main: palette.success },
    warning: { main: palette.warning },
    error: { main: palette.danger },
    background: { default: palette.bg, paper: palette.card },
    text: { primary: palette.text, secondary: palette.textMuted },
    divider: palette.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13.5,
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 700 },
    h3: { fontSize: '1.05rem', fontWeight: 600 },
    h4: { fontSize: '0.95rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' } },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        sizeSmall: { padding: '5px 12px' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${palette.border}`, borderRadius: 12 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: palette.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, background: '#F8FAFC' },
        root: { borderColor: palette.border, padding: '10px 14px' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { background: '#fff' } },
    },
  },
})
