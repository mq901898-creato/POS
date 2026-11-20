import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Autocomplete, Avatar, Badge, Box, Divider, IconButton, InputAdornment, ListItemIcon, ListItemText, Menu, MenuItem, Popover,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import { Bell, LogOut, Menu as MenuIcon, PanelLeft, RotateCcw, Search, ArrowRightLeft } from 'lucide-react'
import { palette } from '../../styles/theme'
import { useDemo } from '../../context/DemoContext'
import { MEDICINES } from '../../data/demoData'

export default function Topbar({ onMenu, onToggleCollapse, sidebarCollapsed, pages, basePath, branchControl, alerts, user, showMedicineSearch = true, medicineSearchPath }) {
  const navigate = useNavigate()
  const { logout, resetDemo, state } = useDemo()
  const [bellAnchor, setBellAnchor] = useState(null)
  const [profileAnchor, setProfileAnchor] = useState(null)

  const options = useMemo(() => {
    const pageOpts = pages.map((p) => ({ kind: 'Page', label: p.label, path: p.path, key: p.path }))
    const medOpts = MEDICINES.map((m) => ({ kind: 'Medicine', label: m.name, sub: `${m.generic} · ${m.barcode}`, path: `${medicineSearchPath}?q=${encodeURIComponent(m.name)}`, key: m.id }))
    return [...pageOpts, ...(showMedicineSearch ? medOpts : [])]
  }, [pages, showMedicineSearch, medicineSearchPath])

  const unread = alerts.length

  return (
    <Stack direction="row" spacing={1.5} sx={{ height: 64, px: { xs: 1.5, md: 2.5 }, bgcolor: '#fff', borderBottom: `1px solid ${palette.border}`, position: 'sticky', top: 0, zIndex: 10, alignItems: 'center' }}>
      <IconButton onClick={onMenu} sx={{ display: { md: 'none' } }} aria-label="Open navigation">
        <MenuIcon size={20} />
      </IconButton>
      <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <IconButton onClick={onToggleCollapse} sx={{ display: { xs: 'none', md: 'inline-flex' }, color: 'text.secondary' }} aria-label="Toggle sidebar">
          <PanelLeft size={19} />
        </IconButton>
      </Tooltip>

      <Autocomplete
        size="small"
        sx={{ flex: 1, maxWidth: 420, minWidth: 0 }}
        options={options}
        groupBy={(o) => o.kind}
        getOptionLabel={(o) => o.label}
        filterOptions={(opts, { inputValue }) => {
          const q = inputValue.trim().toLowerCase()
          if (!q) return []
          return opts.filter((o) => `${o.label} ${o.sub || ''}`.toLowerCase().includes(q)).slice(0, 12)
        }}
        renderOption={(props, o) => (
          <li {...props} key={o.key + o.path}>
            <Box>
              <Typography variant="body2" fontWeight={500}>{o.label}</Typography>
              {o.sub && <Typography variant="caption" color="text.secondary">{o.sub}</Typography>}
            </Box>
          </li>
        )}
        onChange={(_, v) => {
          if (v) {
            navigate(v.path)
          }
        }}
        noOptionsText="No matching medicine or page"
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={showMedicineSearch ? 'Search pages, medicines or barcodes…' : 'Search pages…'}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps?.input,
                startAdornment: <InputAdornment position="start"><Search size={16} color={palette.textMuted} /></InputAdornment>,
              },
            }}
          />
        )}
      />

      <Box sx={{ flex: 1 }} />

      {branchControl}

      <Tooltip title="Alerts & notifications">
        <IconButton onClick={(e) => setBellAnchor(e.currentTarget)} aria-label="Notifications">
          <Badge badgeContent={unread} color="error" max={9}>
            <Bell size={19} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!bellAnchor}
        anchorEl={bellAnchor}
        onClose={() => setBellAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460, borderRadius: 2.5, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3">Notifications</Typography>
          <Typography variant="caption" color="text.secondary">{unread} active</Typography>
        </Box>
        <Divider />
        {alerts.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No active alerts.</Typography>}
        {alerts.map((a) => (
          <MenuItem
            key={a.id}
            onClick={() => { setBellAnchor(null); if (a.path) navigate(a.path) }}
            sx={{ alignItems: 'flex-start', py: 1.25, whiteSpace: 'normal' }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', mt: 0.8, mr: 1.25, flexShrink: 0, bgcolor: a.tone === 'danger' ? palette.danger : a.tone === 'warning' ? palette.warning : palette.blue }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">{a.text}</Typography>
            </Box>
          </MenuItem>
        ))}
        {state.notices.length > 0 && (
          <>
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Recent activity
            </Typography>
            {state.notices.slice(0, 5).map((n) => (
              <Box key={n.id} sx={{ px: 2, py: 0.9 }}>
                <Typography variant="body2">{n.text}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(n.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Typography>
              </Box>
            ))}
          </>
        )}
      </Popover>

      <Tooltip title="Account">
        <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: palette.navy, fontSize: 13 }}>{user.initials}</Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={profileAnchor}
        open={!!profileAnchor}
        onClose={() => setProfileAnchor(null)}
        slotProps={{ paper: { sx: { width: 240, borderRadius: 2, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">{user.title}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setProfileAnchor(null); logout(); navigate('/') }}>
          <ListItemIcon><ArrowRightLeft size={16} /></ListItemIcon>
          <ListItemText>Switch panel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); resetDemo() }}>
          <ListItemIcon><RotateCcw size={16} /></ListItemIcon>
          <ListItemText>Reset demo data</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setProfileAnchor(null); logout(); navigate('/') }}>
          <ListItemIcon sx={{ color: 'inherit' }}><LogOut size={16} /></ListItemIcon>
          <ListItemText>Sign out (demo)</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  )
}
