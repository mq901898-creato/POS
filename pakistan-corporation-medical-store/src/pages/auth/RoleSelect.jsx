import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardActionArea, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Pill, ShieldCheck, Store, ShoppingBag, Wallet, ArrowRight, Shield } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'
import { BRANCHES, BRANCH_BY_ID } from '../../data/demoData'
import { palette } from '../../styles/theme'
import { StatusDot } from '../../components/layout/BranchControl'

const ROLES = [
  {
    key: 'owner',
    title: 'Owner',
    subtitle: 'Consolidated business control',
    description: 'Sales analytics, all five branches, inventory, purchasing, suppliers and the AI Business Assistant.',
    icon: ShieldCheck,
    home: '/owner',
    needsBranch: false,
  },
  {
    key: 'cashier',
    title: 'Cashier',
    subtitle: 'Billing & checkout',
    description: 'Point-of-sale billing, receipts, refunds and the daily cash summary for the assigned branch.',
    icon: Wallet,
    home: '/cashier',
    needsBranch: true,
  },
  {
    key: 'sales',
    title: 'Sales Counter',
    subtitle: 'Medicine catalogue & order prep',
    description: 'Search the medicine catalogue, prepare customer orders and send them to billing.',
    icon: ShoppingBag,
    home: '/sales',
    needsBranch: true,
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const { login, resetDemo } = useDemo()
  const [branchFor, setBranchFor] = useState({ cashier: 'main', sales: 'main' })

  const enter = (role) => {
    const r = ROLES.find((x) => x.key === role)
    const branchId = r.needsBranch ? branchFor[role] : 'all'
    login(role, branchId)
    navigate(r.home)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.bg, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '42% 1fr' } }}>
      <Box sx={{ bgcolor: palette.navy, color: '#fff', p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: { xs: 'auto', lg: '100vh' } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: palette.blue, display: 'grid', placeItems: 'center' }}>
            <Pill size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Pakistan Corporation</Typography>
            <Typography sx={{ color: '#9FB3CF', fontSize: 13 }}>Medical Store · Pharmacy Management</Typography>
          </Box>
        </Stack>

        <Box sx={{ my: { xs: 4, lg: 0 } }}>
          <Typography sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.5, maxWidth: 460 }}>
            One platform for five branches, every counter and every rupee.
          </Typography>
          <Typography sx={{ color: '#B8C6DC', mt: 2, maxWidth: 440, lineHeight: 1.65, fontSize: 14.5 }}>
            Branch-level stock and sales, consolidated owner reporting, fast point-of-sale billing and sales-counter order preparation, in one system.
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 4 }}>
            {['Five branches · branch-specific stock', 'Offline-tolerant branch servers (simulated)', 'Owner-only analytics & AI assistant'].map((t) => (
              <Stack key={t} direction="row" spacing={1.25} sx={{ color: '#D5DEEC', fontSize: 14, alignItems: 'center' }}>
                <Shield size={15} color="#4C8DFF" />
                <span>{t}</span>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ color: '#8FA3C2', fontSize: 12.5, alignItems: 'center' }}>
          <Chip size="small" label="DEMO" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, height: 20 }} />
          <span>Frontend prototype. All names, records and figures are fictitious demonstration data.</span>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 5 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 920 }}>
          <Typography variant="h1" sx={{ fontSize: 22 }}>Choose a panel to continue</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Select the role you want to present. Cashier and sales counter panels open for the branch you choose.
          </Typography>

          <Grid container spacing={2.5}>
            {ROLES.map((r) => {
              const Icon = r.icon
              return (
                <Grid key={r.key} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { borderColor: palette.blue } }}>
                    <CardActionArea onClick={() => enter(r.key)} sx={{ flex: 1, p: 2.5, alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: palette.blueSoft, color: palette.blue, display: 'grid', placeItems: 'center', mb: 2 }}>
                        <Icon size={22} />
                      </Box>
                      <Typography variant="h3">{r.title}</Typography>
                      <Typography variant="caption" color="primary.light" fontWeight={600} sx={{ color: palette.blue }}>{r.subtitle}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.6, minHeight: 66 }}>{r.description}</Typography>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 2, color: palette.blue, fontWeight: 600, fontSize: 13.5, alignItems: 'center' }}>
                        <span>Open {r.title} panel</span>
                        <ArrowRight size={15} />
                      </Stack>
                    </CardActionArea>
                    {r.needsBranch && (
                      <Box sx={{ px: 2.5, pb: 2.5 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          label="Assigned branch"
                          value={branchFor[r.key]}
                          onChange={(e) => setBranchFor((b) => ({ ...b, [r.key]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {BRANCHES.map((b) => (
                            <MenuItem key={b.id} value={b.id}>
                              <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
                                <StatusDot status={b.status} />
                                <span>{b.name}</span>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{b.city}</Typography>
                              </Stack>
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button fullWidth variant="contained" sx={{ mt: 1.25 }} onClick={() => enter(r.key)}>
                          Enter as {r.title}
                        </Button>
                      </Box>
                    )}
                    {!r.needsBranch && (
                      <Box sx={{ px: 2.5, pb: 2.5 }}>
                        <Button fullWidth variant="contained" onClick={() => enter(r.key)}>Enter as Owner</Button>
                      </Box>
                    )}
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Stack direction="row" sx={{ mt: 3, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Branch assignment: {BRANCH_BY_ID[branchFor.cashier].name} (cashier) · {BRANCH_BY_ID[branchFor.sales].name} (sales counter)
            </Typography>
            <Button size="small" color="inherit" sx={{ color: 'text.secondary' }} onClick={resetDemo}>Reset demo data</Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
