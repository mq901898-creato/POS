import { useState } from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { MoreVertical } from 'lucide-react'

/** items: [{ label, icon, onClick, danger, divider }] */
export default function ActionMenu({ items }) {
  const [anchor, setAnchor] = useState(null)
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget) }}
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2 } } }}
      >
        {items.map((it, idx) =>
          it.divider ? (
            <Divider key={`d${idx}`} />
          ) : (
            <MenuItem
              key={it.label}
              onClick={() => { setAnchor(null); it.onClick() }}
              sx={{ color: it.danger ? 'error.main' : 'text.primary', fontSize: 13.5 }}
            >
              {it.icon && <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}><it.icon size={16} /></ListItemIcon>}
              <ListItemText primaryTypographyProps={{ fontSize: 13.5 }}>{it.label}</ListItemText>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  )
}
