# Home Construction Account Ledger (Rojmel)
## Project Specification Document

---

## 1. Overview

A **Rojmel** is a traditional Indian day-book/ledger system for recording daily transactions. This project aims to create a digital version specifically for **home construction expense tracking**.

### Purpose
- Track all construction-related income and expenses
- Manage payments to contractors, laborers, and suppliers
- Monitor material purchases and inventory
- Generate financial reports and summaries
- Maintain party-wise (vendor/contractor) accounts

---

## 2. Core Features

### 2.1 Transaction Management (Rojmel Entry)
| Feature | Description |
|---------|-------------|
| **Date Entry** | Record transaction date |
| **Voucher Number** | Auto-generated unique ID |
| **Party Name** | Contractor/Supplier/Labor name |
| **Description** | Work details or material description |
| **Debit (Jama)** | Money received / Amount owed to us |
| **Credit (Udhar)** | Money paid / Amount we owe |
| **Payment Mode** | Cash / Bank / UPI / Cheque |
| **Category** | Material / Labor / Contractor / Miscellaneous |

### 2.2 Category Types for Construction

```
📁 EXPENSES
├── 🧱 Materials
│   ├── Cement
│   ├── Sand
│   ├── Bricks/Blocks
│   ├── Steel/Iron
│   ├── Wood/Timber
│   ├── Plumbing Materials
│   ├── Electrical Materials
│   ├── Tiles/Flooring
│   ├── Paint
│   └── Hardware/Fittings
│
├── 👷 Labor
│   ├── Mason (Mistri)
│   ├── Helper/Beldar
│   ├── Carpenter
│   ├── Plumber
│   ├── Electrician
│   ├── Painter
│   └── Other Labor
│
├── 🏗️ Contractors
│   ├── Main Contractor
│   ├── Sub-Contractors
│   └── Architect/Engineer Fees
│
├── 🚚 Transport
│   ├── Material Delivery
│   └── Equipment Rental
│
└── 📋 Miscellaneous
    ├── Permits/Approvals
    ├── Water/Electricity Bills
    ├── Site Security
    └── Tea/Food for Workers

📁 INCOME/FUNDS
├── Self Contribution
├── Bank Loan
├── Family Contribution
└── Other Sources
```

### 2.3 Party/Khata Management
- Create and manage vendor/contractor accounts
- Track outstanding balances per party
- View party-wise transaction history
- Generate party ledger statements

### 2.4 Reports & Summaries

| Report | Description |
|--------|-------------|
| **Daily Summary** | All transactions for a specific date |
| **Monthly Summary** | Category-wise expense breakdown |
| **Party Ledger** | Complete transaction history with a party |
| **Category Report** | Spending by category (Materials, Labor, etc.) |
| **Cash Flow** | Income vs Expenses over time |
| **Outstanding Dues** | Pending payments to parties |
| **Budget vs Actual** | Compare planned vs actual spending |

---

## 3. Data Models

### 3.1 Transaction Schema
```javascript
{
  id: "TXN001",
  date: "2024-01-15",
  voucherNo: "V-2024-001",
  partyId: "PARTY001",
  partyName: "Ramesh Cement Supplier",
  description: "50 bags cement @ ₹350",
  category: "materials",
  subCategory: "cement",
  debit: 0,           // Amount received
  credit: 17500,      // Amount paid
  balance: -17500,    // Running balance
  paymentMode: "cash",
  reference: "Bill No. 1234",
  notes: "Delivered to site",
  createdAt: "2024-01-15T10:30:00Z"
}
```

### 3.2 Party Schema
```javascript
{
  id: "PARTY001",
  name: "Ramesh Cement Supplier",
  type: "supplier",       // supplier | contractor | labor | other
  category: "materials",
  phone: "9876543210",
  address: "Industrial Area, City",
  openingBalance: 0,
  currentBalance: -17500, // Negative = we owe them
  createdAt: "2024-01-01T00:00:00Z"
}
```

### 3.3 Category Schema
```javascript
{
  id: "CAT001",
  name: "Cement",
  parentCategory: "materials",
  budget: 200000,
  spent: 17500,
  icon: "🧱"
}
```

---

## 4. User Interface Screens

### 4.1 Main Screens
1. **Dashboard** - Overview with key metrics
2. **Add Transaction** - Quick entry form
3. **Transaction List** - Searchable, filterable list
4. **Parties** - Vendor/Contractor management
5. **Reports** - Various financial reports
6. **Settings** - Categories, backup, preferences

### 4.2 Dashboard Widgets
- Total Spent vs Budget
- Category-wise Pie Chart
- Recent Transactions
- Outstanding Payments
- Monthly Trend Graph

---

## 5. Technical Stack Options

### Option A: Web Application
```
Frontend: React.js / Next.js + TailwindCSS
Backend: Node.js + Express
Database: MongoDB / PostgreSQL
```

### Option B: Mobile-First PWA
```
Frontend: React.js + PWA capabilities
Storage: IndexedDB (offline-first)
Sync: Optional cloud backup
```

### Option C: Desktop Application
```
Framework: Electron + React
Database: SQLite (local)
```

### Option D: Simple Spreadsheet-Like
```
Frontend: React + AG-Grid/Handsontable
Storage: LocalStorage + JSON export
```

---

## 6. MVP (Minimum Viable Product) Features

### Phase 1 - Basic Ledger
- [ ] Add/Edit/Delete transactions
- [ ] Party management (add parties)
- [ ] Date-wise transaction view
- [ ] Simple category selection
- [ ] Daily/Monthly totals
- [ ] Data export (CSV/PDF)

### Phase 2 - Enhanced Features
- [ ] Party-wise ledger view
- [ ] Category-wise reports
- [ ] Budget tracking
- [ ] Dashboard with charts
- [ ] Search and filters

### Phase 3 - Advanced
- [ ] Multi-project support
- [ ] Photo attachments (bills/receipts)
- [ ] Backup & restore
- [ ] Print-friendly reports
- [ ] Multi-language support (Hindi/Gujarati)

---

## 7. Sample UI Mockup (Text-based)

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Home Construction Ledger                    [+ Add New] │
├─────────────────────────────────────────────────────────────┤
│  💰 Total Spent: ₹15,45,000    📊 Budget: ₹25,00,000       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62%               │
├─────────────────────────────────────────────────────────────┤
│  📅 Recent Transactions                                     │
│  ─────────────────────────────────────────────────────────  │
│  15 Jan │ Ramesh Cement      │ 50 bags cement   │ -₹17,500 │
│  15 Jan │ Daily Labor        │ 5 helpers × ₹500 │ -₹2,500  │
│  14 Jan │ Bank Loan          │ Disbursement     │ +₹5,00,000│
│  14 Jan │ Steel Supplier     │ 2 ton TMT bars   │ -₹1,20,000│
├─────────────────────────────────────────────────────────────┤
│  📊 Category Breakdown                                      │
│  Materials ████████████░░░░ ₹8,50,000 (55%)                │
│  Labor    ████████░░░░░░░░ ₹4,20,000 (27%)                 │
│  Contract ████░░░░░░░░░░░░ ₹2,00,000 (13%)                 │
│  Other    █░░░░░░░░░░░░░░░ ₹75,000 (5%)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Terminology (Hindi-English)

| Hindi Term | English | Description |
|------------|---------|-------------|
| Rojmel | Day Book | Daily transaction register |
| Khata | Account/Ledger | Individual party account |
| Jama | Credit/Debit | Amount received/coming in |
| Udhar | Debit/Credit | Amount paid/going out |
| Baki | Balance | Outstanding amount |
| Parat | Party | Vendor/Contractor |
| Rasid | Receipt | Payment receipt |
| Bill/Parcha | Invoice | Bill for goods/services |

---

## 9. Key Considerations

### Data Safety
- Regular auto-backup
- Export to Excel/PDF
- Cloud sync option

### Ease of Use
- Simple data entry (minimal fields)
- Quick add for daily labor payments
- Voice input support (future)

### Offline Capability
- Works without internet
- Sync when online

### Regional Support
- Hindi/Gujarati/English interface
- Indian number format (₹ Lakhs, Crores)
- Date format (DD-MM-YYYY)

---

## 10. Getting Started

To develop this application, I recommend:

1. **Start with MVP** - Basic add/view transactions
2. **Use React + LocalStorage** - Quick prototype
3. **Add IndexedDB** - For larger data handling
4. **Implement Reports** - Charts using Chart.js/Recharts
5. **Style with TailwindCSS** - Clean, modern UI

---

## Next Steps

Would you like me to:
1. **Create the basic project structure** with React?
2. **Build a working prototype** with core features?
3. **Design detailed wireframes** for the UI?
4. **Create a sample spreadsheet template** first?

Let me know which direction you'd like to proceed!
