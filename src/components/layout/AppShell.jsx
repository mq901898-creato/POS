import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, Drawer, useMediaQuery } from '@mui/material'
import Sidebar, { SIDEBAR_COLLAPSED, SIDEBAR_WIDTH } from './Sidebar'
import Topbar from './Topbar'
import Toaster from './Toaster'
import { palette } from '../../styles/theme'

/**
 * Shared frame for every role. Each layout passes its own navigation,
 * user card, branch control and alerts.
 */
export default function AppShell({ sections, roleLabel, user, pages, branchControl, alerts, showMedicineSearch, medicineSearchPath }) {
  const isDesktop = useMediaQuery('(min-width:900px)')
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('pcms-sidebar') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem('pcms-sidebar', c ? '0' : '1')
      return !c
    })
  }

  const sidebarProps = { sections, roleLabel, user }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: palette.bg }}>
      {isDesktop ? (
        <Box sx={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', transition: 'width .2s ease' }}>
          <Sidebar {...sidebarProps} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        </Box>
      ) : (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, border: 0 } } }}>
          <Sidebar {...sidebarProps} collapsed={false} showCollapse={false} onToggleCollapse={() => {}} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          onMenu={() => setMobileOpen(true)}
          onToggleCollapse={toggleCollapse}
          sidebarCollapsed={collapsed}
          pages={pages}
          branchControl={branchControl}
          alerts={alerts}
          user={user}
          showMedicineSearch={showMedicineSearch}
          medicineSearchPath={medicineSearchPath}
        />
        <Box key={location.pathname} component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, minWidth: 0, animation: 'pageIn .25s ease' }}>
          <Outlet />
        </Box>
      </Box>
      <Toaster />
    </Box>
  )
}
