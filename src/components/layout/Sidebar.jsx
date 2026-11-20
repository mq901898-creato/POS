import { NavLink } from 'react-router-dom'
import { Avatar, Box, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { ChevronsLeft, ChevronsRight, Pill } from 'lucide-react'
import { palette } from '../../styles/theme'

export const SIDEBAR_WIDTH = 248
export const SIDEBAR_COLLAPSED = 76

export default function Sidebar({ sections, collapsed, onToggleCollapse, roleLabel, user, showCollapse = true }) {
  const w = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH
  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{ width: w, height: '100%', bgcolor: palette.navy, color: '#D5DEEC', display: 'flex', flexDirection: 'column', transition: 'width .2s ease', overflow: 'hidden' }}
    >
      <Stack direction="row" spacing={1.25} sx={{ px: collapsed ? 1.5 : 2.25, py: 2, minHeight: 68, alignItems: 'center' }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: palette.blue, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Pill size={20} color="#fff" />
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Pakistan Corporation</Typography>
            <Typography sx={{ color: '#9FB3CF', fontSize: 11.5, whiteSpace: 'nowrap' }}>Medical Store · {roleLabel}</Typography>
          </Box>
        )}
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 1 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            {!collapsed && (
              <Typography sx={{ px: 1.5, py: 0.75, fontSize: 10.5, letterSpacing: 0.9, textTransform: 'uppercase', color: '#7F93B2', fontWeight: 600 }}>
                {section.title}
              </Typography>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const link = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <Stack direction="row" spacing={1.5} sx={{ position: 'relative',
                        px: collapsed ? 0 : 1.5,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        height: 40,
                        borderRadius: 2,
                        mb: 0.25,
                        color: isActive ? '#fff' : '#B8C6DC',
                        bgcolor: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: 13.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
                        '&::before': isActive
                          ? { content: '""', position: 'absolute', left: -8, top: 9, bottom: 9, width: 3, borderRadius: 2, bgcolor: '#4C8DFF' }
                          : {},
                        alignItems: 'center',
                      }}>
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge ? (
                        <Box sx={{ ml: 'auto', minWidth: 20, height: 20, px: 0.75, borderRadius: 10, bgcolor: item.badgeTone === 'danger' ? palette.danger : '#2E4A74', color: '#fff', fontSize: 11, display: 'grid', placeItems: 'center', fontWeight: 600 }}>
                          {item.badge}
                        </Box>
                      ) : null}
                    </Stack>
                  )}
                </NavLink>
              )
              return collapsed ? (
                <Tooltip key={item.path} title={item.label} placement="right">
                  {link}
                </Tooltip>
              ) : (
                link
              )
            })}
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Stack direction="row" spacing={1.25} sx={{ p: 1.5, justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: palette.blue, fontSize: 13 }}>{user.initials}</Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{user.name}</Typography>
              <Typography sx={{ color: '#8FA3C2', fontSize: 11.5, whiteSpace: 'nowrap' }}>{user.title}</Typography>
            </Box>
          )}
        </Stack>
        {showCollapse && !collapsed && (
          <IconButton size="small" onClick={onToggleCollapse} aria-label="Collapse sidebar" sx={{ color: '#9FB3CF' }}>
            <ChevronsLeft size={18} />
          </IconButton>
        )}
      </Stack>
      {showCollapse && collapsed && (
        <IconButton onClick={onToggleCollapse} aria-label="Expand sidebar" sx={{ color: '#9FB3CF', alignSelf: 'center', mb: 1 }}>
          <ChevronsRight size={18} />
        </IconButton>
      )}
    </Box>
  )
}
