// ----------------------------------------------------------------------------
// DEMONSTRATION DATA ONLY
// All records below are fictitious mock data generated with a seeded PRNG so
// that every load of the demo shows the same, internally consistent figures.
// ----------------------------------------------------------------------------

// Demo "now": Wednesday 18 Nov 2026, 9:30 PM (end of trading day snapshot)
export const ANCHOR = new Date(2026, 10, 18, 21, 30)

export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n) => String(n).padStart(2, '0')
export const toDayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// ---------------------------------------------------------------- BRANCHES
export const BRANCHES = [
  { id: 'main', name: 'Main Branch', code: 'MN', city: 'Karachi', status: 'Online', sync: 'Synced 2 min ago', cashier: 'Imran Ali', salesCounter: 'Saima Bibi', manager: 'Usman Qureshi', scale: 1.35 },
  { id: 'b02', name: 'Branch 02', code: 'B2', city: 'Karachi', status: 'Online', sync: 'Synced 5 min ago', cashier: 'Hamza Khan', salesCounter: 'Nadia Parveen', manager: 'Zain Abbas', scale: 1.1 },
  { id: 'b03', name: 'Branch 03', code: 'B3', city: 'Lahore', status: 'Online', sync: 'Synced 1 min ago', cashier: 'Ayesha Malik', salesCounter: 'Bilal Ahmed', manager: 'Farhan Iqbal', scale: 1.0 },
  { id: 'b04', name: 'Branch 04', code: 'B4', city: 'Rawalpindi', status: 'Syncing', sync: 'Syncing 14 queued updates', cashier: 'Kashif Mahmood', salesCounter: 'Sana Riaz', manager: 'Adnan Shah', scale: 0.85 },
  { id: 'b05', name: 'Branch 05', code: 'B5', city: 'Faisalabad', status: 'Offline', sync: 'Offline since 07:10 · 6 queued updates', cashier: 'Rabia Nawaz', salesCounter: 'Tariq Javed', manager: 'Saad Mirza', scale: 0.7 },
]

export const BRANCH_BY_ID = Object.fromEntries(BRANCHES.map((b) => [b.id, b]))

export const DEMO_USERS = {
  owner: { name: 'Tariq Mehmood', title: 'Owner & Managing Director' },
}

// ---------------------------------------------------------------- CATEGORIES
export const CATEGORY_COLORS = {
  Analgesics: '#1F5FBF',
  Antibiotics: '#D92D20',
  Pediatric: '#D98E04',
  Vitamins: '#12A150',
  'Antacids & GI': '#7A5AF8',
  Rehydration: '#0E8A8A',
  Allergy: '#C2410C',
  Respiratory: '#0369A1',
  Diabetes: '#A16207',
  Cardiac: '#BE185D',
  Dermatology: '#4D7C0F',
}
export const CATEGORIES = Object.keys(CATEGORY_COLORS)

// ---------------------------------------------------------------- MEDICINES
// id, name, generic, category, form, manufacturer, barcode, purchasePrice, salePrice, minStock (per branch), pack
export const MEDICINES = [
  { id: 'MED-001', name: 'Panadol 500mg', generic: 'Paracetamol 500mg', category: 'Analgesics', form: 'Tablet', manufacturer: 'GSK Pakistan', barcode: '8961000100011', purchasePrice: 28, salePrice: 40, minStock: 40, pack: '10 tablets' },
  { id: 'MED-002', name: 'Panadol Extra', generic: 'Paracetamol 500mg + Caffeine 65mg', category: 'Analgesics', form: 'Tablet', manufacturer: 'GSK Pakistan', barcode: '8961000100012', purchasePrice: 36, salePrice: 52, minStock: 25, pack: '10 tablets' },
  { id: 'MED-003', name: 'Paracetamol 500mg (Generic)', generic: 'Paracetamol 500mg', category: 'Analgesics', form: 'Tablet', manufacturer: 'Getz Pharma', barcode: '8961000100013', purchasePrice: 14, salePrice: 22, minStock: 60, pack: '10 tablets' },
  { id: 'MED-004', name: 'Brufen 400mg', generic: 'Ibuprofen 400mg', category: 'Analgesics', form: 'Tablet', manufacturer: 'Abbott Pakistan', barcode: '8961000100014', purchasePrice: 45, salePrice: 68, minStock: 30, pack: '10 tablets' },
  { id: 'MED-005', name: 'Disprin 300mg', generic: 'Aspirin 300mg', category: 'Analgesics', form: 'Tablet', manufacturer: 'Reckitt Pakistan', barcode: '8961000100015', purchasePrice: 12, salePrice: 20, minStock: 30, pack: '10 tablets' },
  { id: 'MED-006', name: 'Ponstan 500mg', generic: 'Mefenamic Acid 500mg', category: 'Analgesics', form: 'Capsule', manufacturer: 'Pfizer Pakistan', barcode: '8961000100016', purchasePrice: 22, salePrice: 36, minStock: 20, pack: '10 capsules' },
  { id: 'MED-007', name: 'Augmentin 625mg', generic: 'Amoxicillin + Clavulanic Acid 625mg', category: 'Antibiotics', form: 'Tablet', manufacturer: 'GSK Pakistan', barcode: '8961000100017', purchasePrice: 210, salePrice: 285, minStock: 20, pack: '6 tablets' },
  { id: 'MED-008', name: 'Flagyl 400mg', generic: 'Metronidazole 400mg', category: 'Antibiotics', form: 'Tablet', manufacturer: 'Sanofi Pakistan', barcode: '8961000100018', purchasePrice: 18, salePrice: 30, minStock: 30, pack: '10 tablets' },
  { id: 'MED-009', name: 'Augmentin 375mg Suspension', generic: 'Amoxicillin + Clavulanic Acid (Paediatric)', category: 'Pediatric', form: 'Syrup', manufacturer: 'GSK Pakistan', barcode: '8961000100019', purchasePrice: 260, salePrice: 340, minStock: 10, pack: '70ml bottle' },
  { id: 'MED-010', name: 'Calpol 120mg/5ml Syrup', generic: 'Paracetamol 120mg/5ml', category: 'Pediatric', form: 'Syrup', manufacturer: 'GSK Pakistan', barcode: '8961000100020', purchasePrice: 150, salePrice: 205, minStock: 15, pack: '60ml bottle' },
  { id: 'MED-011', name: 'Calpol Infant Drops', generic: 'Paracetamol 100mg/ml', category: 'Pediatric', form: 'Drops', manufacturer: 'GSK Pakistan', barcode: '8961000100021', purchasePrice: 230, salePrice: 295, minStock: 8, pack: '15ml dropper' },
  { id: 'MED-012', name: 'Zinc Sulphate 20mg Dispersible', generic: 'Zinc Sulphate 20mg', category: 'Pediatric', form: 'Tablet', manufacturer: 'Getz Pharma', barcode: '8961000100022', purchasePrice: 9, salePrice: 16, minStock: 25, pack: '10 tablets' },
  { id: 'MED-013', name: 'Vitamin C 500mg', generic: 'Ascorbic Acid 500mg', category: 'Vitamins', form: 'Tablet', manufacturer: 'Hilton Pharma', barcode: '8961000100023', purchasePrice: 8, salePrice: 15, minStock: 50, pack: '10 tablets' },
  { id: 'MED-014', name: 'Becosules Capsules', generic: 'Vitamin B-Complex + Vitamin C', category: 'Vitamins', form: 'Capsule', manufacturer: 'Pfizer Pakistan', barcode: '8961000100024', purchasePrice: 30, salePrice: 45, minStock: 30, pack: '20 capsules' },
  { id: 'MED-015', name: 'ORS Sachet', generic: 'Oral Rehydration Salts', category: 'Rehydration', form: 'Sachet', manufacturer: 'Abbott Pakistan', barcode: '8961000100025', purchasePrice: 14, salePrice: 25, minStock: 40, pack: '1 sachet' },
  { id: 'MED-016', name: 'Omeprazole 20mg', generic: 'Omeprazole 20mg', category: 'Antacids & GI', form: 'Capsule', manufacturer: 'Getz Pharma', barcode: '8961000100026', purchasePrice: 10, salePrice: 18, minStock: 40, pack: '14 capsules' },
  { id: 'MED-017', name: 'Nexum 40mg', generic: 'Esomeprazole 40mg', category: 'Antacids & GI', form: 'Tablet', manufacturer: 'AstraZeneca Pakistan', barcode: '8961000100027', purchasePrice: 85, salePrice: 120, minStock: 15, pack: '14 tablets' },
  { id: 'MED-018', name: 'Gaviscon Liquid 200ml', generic: 'Sodium Alginate + Antacid', category: 'Antacids & GI', form: 'Syrup', manufacturer: 'Reckitt Pakistan', barcode: '8961000100028', purchasePrice: 230, salePrice: 310, minStock: 6, pack: '200ml bottle' },
  { id: 'MED-019', name: 'Telfast 120mg', generic: 'Fexofenadine 120mg', category: 'Allergy', form: 'Tablet', manufacturer: 'Sanofi Pakistan', barcode: '8961000100029', purchasePrice: 55, salePrice: 80, minStock: 20, pack: '10 tablets' },
  { id: 'MED-020', name: 'Ventolin Inhaler 100mcg', generic: 'Salbutamol 100mcg/dose', category: 'Respiratory', form: 'Inhaler', manufacturer: 'GSK Pakistan', barcode: '8961000100030', purchasePrice: 380, salePrice: 490, minStock: 6, pack: '200 doses' },
  { id: 'MED-021', name: 'Glucophage 500mg', generic: 'Metformin 500mg', category: 'Diabetes', form: 'Tablet', manufacturer: 'Merck Pakistan', barcode: '8961000100031', purchasePrice: 18, salePrice: 28, minStock: 30, pack: '20 tablets' },
  { id: 'MED-022', name: 'Amaryl 2mg', generic: 'Glimepiride 2mg', category: 'Diabetes', form: 'Tablet', manufacturer: 'Sanofi Pakistan', barcode: '8961000100032', purchasePrice: 40, salePrice: 60, minStock: 15, pack: '10 tablets' },
  { id: 'MED-023', name: 'Concor 5mg', generic: 'Bisoprolol 5mg', category: 'Cardiac', form: 'Tablet', manufacturer: 'Merck Pakistan', barcode: '8961000100033', purchasePrice: 75, salePrice: 105, minStock: 15, pack: '10 tablets' },
  { id: 'MED-024', name: 'Lipitor 20mg', generic: 'Atorvastatin 20mg', category: 'Cardiac', form: 'Tablet', manufacturer: 'Pfizer Pakistan', barcode: '8961000100034', purchasePrice: 110, salePrice: 155, minStock: 12, pack: '10 tablets' },
  { id: 'MED-025', name: 'Betnovate-N Cream 20g', generic: 'Betamethasone + Neomycin', category: 'Dermatology', form: 'Cream', manufacturer: 'GSK Pakistan', barcode: '8961000100035', purchasePrice: 165, salePrice: 225, minStock: 8, pack: '20g tube' },
  { id: 'MED-026', name: 'Hydrocortisone 1% Cream', generic: 'Hydrocortisone 1%', category: 'Dermatology', form: 'Cream', manufacturer: 'Hilton Pharma', barcode: '8961000100036', purchasePrice: 60, salePrice: 90, minStock: 10, pack: '15g tube' },
]
export const MEDICINE_BY_ID = Object.fromEntries(MEDICINES.map((m) => [m.id, m]))

// ---------------------------------------------------------------- INVENTORY (branch-specific stock)
// Each row = one batch of one medicine held at one branch.
function buildInventory() {
  const rng = mulberry32(2026)
  const rows = []
  MEDICINES.forEach((m) => {
    BRANCHES.forEach((b) => {
      const expDays = Math.round(-12 + rng() * 470)
      const qty = Math.max(0, Math.round(m.minStock * (0.3 + rng() * 4.2)))
      rows.push({
        id: `INV-${m.id.slice(-3)}-${b.code}`,
        medicineId: m.id,
        branchId: b.id,
        batchNo: `B${m.id.slice(-3)}${b.code}${1000 + Math.floor(rng() * 8999)}`,
        expiry: toDayKey(addDays(ANCHOR, expDays)),
        qty,
      })
    })
  })
  return rows
}
export const INVENTORY = buildInventory()

// ---------------------------------------------------------------- CUSTOMERS
export const CUSTOMERS = [
  { id: 'C-001', name: 'Walk-in Customer', phone: '—' },
  { id: 'C-002', name: 'Ahmed Raza', phone: '0321-5558124' },
  { id: 'C-003', name: 'Fatima Noor', phone: '0333-2214467' },
  { id: 'C-004', name: 'Hassan Sheikh', phone: '0300-7749012' },
  { id: 'C-005', name: 'Mariam Qadir', phone: '0345-6610987' },
  { id: 'C-006', name: 'Zubair Anwar', phone: '0312-4478230' },
  { id: 'C-007', name: 'Sadia Javed', phone: '0301-9902175' },
  { id: 'C-008', name: 'Omar Farooq', phone: '0334-1186542' },
  { id: 'C-009', name: 'Hina Baig', phone: '0322-7735091' },
  { id: 'C-010', name: 'Kamran Yousaf', phone: '0300-4420863' },
  { id: 'C-011', name: 'Rubina Asif', phone: '0345-1957620' },
  { id: 'C-012', name: 'Usman Tahir', phone: '0313-8864215' },
]

// ---------------------------------------------------------------- SUPPLIERS
export const SUPPLIERS = [
  { id: 'SUP-01', name: 'Al-Shifa Wholesale Traders', contact: 'Naveed Ashraf', phone: '0300-1110201', city: 'Karachi', terms: '30 days' },
  { id: 'SUP-02', name: 'Frontier Medicine Distributors', contact: 'Gul Zaman', phone: '0333-2220345', city: 'Peshawar', terms: '45 days' },
  { id: 'SUP-03', name: 'Indus Pharma Supplies', contact: 'Sohail Akbar', phone: '0321-3330456', city: 'Hyderabad', terms: '30 days' },
  { id: 'SUP-04', name: 'Shalimar Drug House', contact: 'Rizwan Haider', phone: '0345-4440567', city: 'Lahore', terms: '60 days' },
  { id: 'SUP-05', name: 'Mehran Medical Agency', contact: 'Asim Nawaz', phone: '0302-5550678', city: 'Karachi', terms: '30 days' },
  { id: 'SUP-06', name: 'Punjab Pharma Traders', contact: 'Khalid Mahmood', phone: '0312-6660789', city: 'Multan', terms: '45 days' },
  { id: 'SUP-07', name: 'Crescent Health Distributors', contact: 'Imtiaz Ali', phone: '0333-7770890', city: 'Islamabad', terms: '30 days' },
  { id: 'SUP-08', name: 'Gulf Medico Supplies', contact: 'Faisal Rehman', phone: '0300-8880901', city: 'Karachi', terms: '15 days' },
  { id: 'SUP-09', name: 'Lahore Pharma Hub', contact: 'Shahid Iqbal', phone: '0322-9990012', city: 'Lahore', terms: '30 days' },
  { id: 'SUP-10', name: 'Sindh Wholesale Chemists', contact: 'Arif Memon', phone: '0301-0102034', city: 'Sukkur', terms: '60 days' },
]
export const SUPPLIER_BY_ID = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]))

// ---------------------------------------------------------------- SALES (detailed, Sep 1 – 18 Nov 2026)
const PAYMENT_METHODS = [
  ['Cash', 55],
  ['Card', 20],
  ['Mobile Wallet', 15],
  ['Bank Transfer', 10],
]
function pickPayment(r) {
  let acc = 0
  const total = PAYMENT_METHODS.reduce((s, [, w]) => s + w, 0)
  const x = r * total
  for (const [name, w] of PAYMENT_METHODS) {
    acc += w
    if (x < acc) return name
  }
  return 'Cash'
}

function buildSales() {
  const rng = mulberry32(777)
  const sales = []
  const start = new Date(2026, 8, 1)
  const days = Math.round((ANCHOR - start) / 86400000) + 1
  const popular = MEDICINES.map((m, i) => ({ m, w: i < 9 ? 3 : i < 17 ? 2 : 1 }))
  const weighted = popular.flatMap(({ m, w }) => Array(w).fill(m))
  const seqByDay = {}

  for (let d = 0; d < days; d++) {
    const day = addDays(start, d)
    const weekend = day.getDay() === 0
    BRANCHES.forEach((b) => {
      const count = Math.max(1, Math.round((2 + rng() * 4.5) * b.scale * (weekend ? 1.2 : 1)))
      for (let k = 0; k < count; k++) {
        const hour = 9 + Math.floor(rng() * 12)
        const minute = Math.floor(rng() * 60)
        const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute)
        if (when > ANCHOR) continue
        const dk = toDayKey(day)
        const seqKey = `${b.code}-${dk}`
        seqByDay[seqKey] = (seqByDay[seqKey] || 0) + 1
        const itemCount = 1 + Math.floor(rng() * 3)
        const used = new Set()
        const items = []
        for (let i = 0; i < itemCount; i++) {
          const m = weighted[Math.floor(rng() * weighted.length)]
          if (used.has(m.id)) continue
          used.add(m.id)
          const qty = 1 + Math.floor(rng() * 3)
          items.push({ medicineId: m.id, name: m.name, qty, price: m.salePrice, cost: m.purchasePrice })
        }
        const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
        const discRoll = rng()
        let discount = 0
        if (discRoll > 0.85) discount = Math.round(subtotal * 0.05)
        else if (discRoll > 0.7) discount = 20
        const total = subtotal - discount
        const customer = rng() < 0.35 ? CUSTOMERS[0] : CUSTOMERS[1 + Math.floor(rng() * (CUSTOMERS.length - 1))]
        const refunded = rng() < 0.025
        sales.push({
          id: `PCMS-${b.code}-${dk.replace(/-/g, '')}-${String(seqByDay[seqKey]).padStart(3, '0')}`,
          branchId: b.id,
          createdAt: when.toISOString(),
          cashier: b.cashier,
          customerId: customer.id,
          customerName: customer.name,
          items,
          subtotal,
          discount,
          total,
          payment: pickPayment(rng()),
          status: refunded ? 'Refunded' : 'Completed',
          refundAmount: refunded ? total : 0,
          refundReason: refunded ? ['Wrong medicine given', 'Customer changed mind', 'Packaging damaged'][Math.floor(rng() * 3)] : '',
        })
      }
    })
  }
  return sales.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
export const SALES = buildSales()

// ---------------------------------------------------------------- MONTHLY ARCHIVE (Jan–Aug 2026, summarised)
// Used only for year-to-date and long-range reports. Detailed records begin 1 Sep 2026.
function buildArchive() {
  const rng = mulberry32(4242)
  const rows = []
  for (let month = 0; month < 8; month++) {
    BRANCHES.forEach((b) => {
      const base = 50000 * b.scale * (1 + month * 0.025)
      const sales = Math.round(base * (0.9 + rng() * 0.2))
      const refunds = Math.round(sales * (0.01 + rng() * 0.02))
      const cash = Math.round((sales - refunds) * 0.55)
      const card = Math.round((sales - refunds) * 0.2)
      const online = Math.round((sales - refunds) * 0.25)
      const bank = sales - refunds - cash - card - online
      rows.push({
        month: `2026-${pad(month + 1)}`,
        branchId: b.id,
        sales,
        refunds,
        cash,
        card,
        online,
        bank,
        profit: Math.round((sales - refunds) * (0.27 + rng() * 0.04)),
        orders: Math.round(sales / 690),
      })
    })
  }
  return rows
}
export const MONTHLY_ARCHIVE = buildArchive()

// ---------------------------------------------------------------- PURCHASE ORDERS
function buildPurchases() {
  const rng = mulberry32(99)
  const statuses = ['Received', 'Received', 'Partially Received', 'Ordered', 'Received', 'Pending Approval']
  const pos = []
  for (let i = 0; i < 14; i++) {
    const supplier = SUPPLIERS[i % SUPPLIERS.length]
    const branch = BRANCHES[i % BRANCHES.length]
    const orderDate = addDays(ANCHOR, -Math.round(3 + rng() * 60))
    const itemCount = 3 + Math.floor(rng() * 4)
    const items = []
    const used = new Set()
    for (let k = 0; k < itemCount; k++) {
      const m = MEDICINES[Math.floor(rng() * MEDICINES.length)]
      if (used.has(m.id)) continue
      used.add(m.id)
      const qty = 20 + Math.floor(rng() * 100)
      const unitCost = m.purchasePrice
      items.push({ medicineId: m.id, name: m.name, qty, unitCost, received: 0 })
    }
    const status = statuses[i % statuses.length]
    items.forEach((it) => {
      if (status === 'Received') it.received = it.qty
      else if (status === 'Partially Received') it.received = Math.floor(it.qty * 0.5)
    })
    const total = items.reduce((s, it) => s + it.qty * it.unitCost, 0)
    const paid = status === 'Pending Approval' ? 0 : Math.round(total * (i % 3 === 0 ? 1 : i % 3 === 1 ? 0.5 : 0))
    pos.push({
      id: `PO-2026-${String(101 + i).padStart(4, '0')}`,
      supplierId: supplier.id,
      branchId: branch.id,
      orderDate: toDayKey(orderDate),
      expectedDate: toDayKey(addDays(orderDate, 5 + Math.floor(rng() * 5))),
      items,
      total,
      status,
      paid,
      paymentHistory: paid ? [{ date: toDayKey(addDays(orderDate, 7)), amount: paid, method: 'Bank Transfer' }] : [],
    })
  }
  return pos
}
export const PURCHASE_ORDERS = buildPurchases()

// ---------------------------------------------------------------- INITIAL SALES-COUNTER ORDERS (queue to cashier)
export const INITIAL_ORDERS = [
  {
    id: 'ORD-0481',
    branchId: 'main',
    customerName: 'Ahmed Raza',
    createdAt: new Date(2026, 10, 18, 20, 52).toISOString(),
    items: [
      { medicineId: 'MED-001', name: 'Panadol 500mg', qty: 2, price: 40 },
      { medicineId: 'MED-015', name: 'ORS Sachet', qty: 4, price: 25 },
    ],
    status: 'Pending',
    by: 'Saima Bibi',
  },
  {
    id: 'ORD-0482',
    branchId: 'main',
    customerName: 'Walk-in Customer',
    createdAt: new Date(2026, 10, 18, 21, 5).toISOString(),
    items: [{ medicineId: 'MED-007', name: 'Augmentin 625mg', qty: 1, price: 285 }],
    status: 'Pending',
    by: 'Saima Bibi',
  },
]

// ---------------------------------------------------------------- STOCK TRANSFERS (simulated, between branches)
export const INITIAL_TRANSFERS = [
  { id: 'TRF-0031', from: 'main', to: 'b05', medicineId: 'MED-020', qty: 3, status: 'Awaiting Dispatch', requestedBy: 'Usman Qureshi', date: toDayKey(addDays(ANCHOR, -1)) },
  { id: 'TRF-0032', from: 'b02', to: 'b03', medicineId: 'MED-007', qty: 5, status: 'In Transit', requestedBy: 'Zain Abbas', date: toDayKey(ANCHOR) },
]

// ---------------------------------------------------------------- STOCK ADJUSTMENT LOG (seed)
export const INITIAL_ADJUSTMENTS = [
  { id: 'ADJ-1191', inventoryId: 'INV-001-MN', delta: -2, reason: 'Damaged packaging', date: toDayKey(addDays(ANCHOR, -2)) },
  { id: 'ADJ-1192', inventoryId: 'INV-013-B3', delta: 10, reason: 'Stock count correction', date: toDayKey(addDays(ANCHOR, -4)) },
]
