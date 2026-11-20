import { useMemo, useState } from 'react'
import {
  Box, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TableSortLabel, TextField, Typography, Paper,
} from '@mui/material'
import { Search } from 'lucide-react'
import EmptyState from '../common/EmptyState'

/**
 * Generic table with search, sorting and pagination.
 * columns: [{ id, label, align, sortValue(row), render(row), width }]
 * searchFields: (row) => string | array of keys
 */
export default function DataTable({
  columns,
  rows,
  searchFields,
  searchPlaceholder = 'Search…',
  toolbar,
  defaultSort,
  rowsPerPage = 8,
  onRowClick,
  emptyTitle,
  emptyText,
  dense,
  stickyHeader,
  maxHeight,
  toolbarRight,
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(defaultSort || { id: null, dir: 'asc' })
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(rowsPerPage)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const values = searchFields ? searchFields(row) : Object.values(row)
      const arr = Array.isArray(values) ? values : [values]
      return arr.some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [rows, query, searchFields])

  const sorted = useMemo(() => {
    if (!sort.id) return filtered
    const col = columns.find((c) => c.id === sort.id)
    if (!col) return filtered
    const getVal = col.sortValue || ((r) => r[col.id])
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [filtered, sort, columns])

  const pageRows = sorted.slice(page * perPage, page * perPage + perPage)
  const lastPage = Math.max(0, Math.ceil(sorted.length / perPage) - 1)
  const safePage = Math.min(page, lastPage)

  const toggleSort = (col) => {
    setSort((s) => (s.id === col.id ? { id: col.id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id: col.id, dir: 'asc' }))
    setPage(0)
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Stack direction="row" spacing={1.25} useFlexGap sx={{ flex: 1, minWidth: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {searchFields && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0) }}
              sx={{ width: { xs: '100%', sm: 280 } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
            />
          )}
          {toolbar}
        </Stack>
        {toolbarRight}
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight, overflowX: 'auto' }}>
        <Table size={dense ? 'small' : 'medium'} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'} sx={{ width: col.width, whiteSpace: 'nowrap' }}>
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <TableSortLabel active={sort.id === col.id} direction={sort.id === col.id ? sort.dir : 'asc'} onClick={() => toggleSort(col)}>
                      {col.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row, i) => (
              <TableRow
                key={row.id ?? i}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'} sx={{ whiteSpace: col.wrap ? 'normal' : 'nowrap' }}>
                    {col.render ? col.render(row) : row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sorted.length === 0 && (
          <EmptyState title={emptyTitle || 'No records match'} text={emptyText || 'Try a different search term or clear the filters.'} />
        )}
      </TableContainer>

      {sorted.length > 0 && (
        <TablePagination
          component="div"
          count={sorted.length}
          page={safePage}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={[8, 15, 25]}
          labelRowsPerPage="Rows"
          sx={{ borderTop: 'none' }}
        />
      )}
      {sorted.length === 0 && <Typography variant="caption" color="text.secondary" />}
    </Box>
  )
}
