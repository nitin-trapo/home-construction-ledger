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

### Phase 1 - Basic Ledger ✅ COMPLETED
- [x] Add/Edit/Delete transactions
- [x] Party management (add parties)
- [x] Date-wise transaction view
- [x] Simple category selection
- [x] Daily/Monthly totals
- [x] Data export (JSON/PDF)

### Phase 2 - Enhanced Features ✅ COMPLETED
- [x] Party-wise ledger view
- [x] Category-wise reports
- [x] Budget tracking
- [x] Dashboard with charts
- [x] Search and filters

### Phase 3 - Advanced 🔄 IN PROGRESS
- [ ] Multi-project support
- [ ] Photo attachments (bills/receipts)
- [x] Backup & restore
- [x] Print-friendly reports (PDF)
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

---

## 11. Current Implementation Status

### 11.1 Technology Stack (Implemented)
```
Frontend: React 18 + Vite 6
Styling: TailwindCSS 3.4
Charts: Recharts 2.13
Icons: Lucide React
Date Handling: date-fns 4.1
PDF Export: jsPDF + jspdf-autotable
Storage: LocalStorage (offline-first)
```

### 11.2 Implemented Features

#### ✅ Phase 1 - Basic Ledger (COMPLETED)
| Feature | Status | Details |
|---------|--------|---------|
| Add/Edit/Delete transactions | ✅ Done | Full CRUD operations |
| Party management | ✅ Done | Add/Edit/Delete parties with balance tracking |
| Date-wise transaction view | ✅ Done | Sortable and filterable |
| Category selection | ✅ Done | 6 main categories with subcategories |
| Daily/Monthly totals | ✅ Done | Dashboard + Reports |
| Data export (JSON/PDF) | ✅ Done | Backup & report export |

#### ✅ Phase 2 - Enhanced Features (COMPLETED)
| Feature | Status | Details |
|---------|--------|---------|
| Party-wise ledger view | ✅ Done | PartyLedger.jsx with full history |
| Category-wise reports | ✅ Done | Pie charts + bar charts |
| Budget tracking | ✅ Done | Progress bar + remaining calculation |
| Dashboard with charts | ✅ Done | Recharts integration |
| Search and filters | ✅ Done | By party, category, date, type |

#### 🔄 Phase 3 - Advanced (PARTIAL)
| Feature | Status | Details |
|---------|--------|---------|
| Multi-project support | ❌ Pending | Single project only |
| Photo attachments | ❌ Pending | Not implemented |
| Backup & restore | ✅ Done | JSON import/export |
| Print-friendly reports | ✅ Done | PDF export with jsPDF |
| Multi-language support | ❌ Pending | English only |

### 11.3 Application Structure

```
app/
├── src/
│   ├── App.jsx              # Main app with navigation
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   ├── pages/
│   │   ├── Dashboard.jsx    # Overview with stats & charts
│   │   ├── Transactions.jsx # Transaction list with filters
│   │   ├── AddTransaction.jsx # Income/Receipt entry form
│   │   ├── AddPurchase.jsx  # Credit purchase entry
│   │   ├── AddPayment.jsx   # Payment to party
│   │   ├── Parties.jsx      # Party management
│   │   ├── PartyLedger.jsx  # Individual party ledger
│   │   ├── CompanyLedger.jsx # Full company ledger with PDF export
│   │   ├── Reports.jsx      # Analytics & reports
│   │   └── Settings.jsx     # Project settings & backup
│   └── utils/
│       ├── storage.js       # LocalStorage CRUD operations
│       └── helpers.js       # Formatting & utility functions
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### 11.4 Entry Types Implemented

| Entry Type | Purpose | Fields |
|------------|---------|--------|
| **Purchase Entry** | Record credit purchases from suppliers | Date, Voucher No, Party, Category, Sub-Category, Amount, Description, Invoice No, Notes |
| **Payment Entry** | Record payments made to parties | Date, Voucher No, Party, Amount, Payment Mode (Cash/Bank/UPI/Cheque), Reference, Notes |
| **Receipt/Income** | Record funds received | Date, Voucher No, Party, Category, Sub-Category, Amount, Description, Payment Mode, Reference, Notes |

### 11.4.1 Transaction Form Features
- **Auto-generated Voucher Numbers** - Format: `V-YYYYMM-XXX`
- **Quick Party Add** - Add new party directly from transaction form via modal
- **Dynamic Sub-categories** - Sub-category options change based on selected category
- **Party Balance Display** - Shows current outstanding balance when selecting party for payment
- **Pay Full Button** - One-click option to pay full outstanding amount
- **Form Validation** - Required fields validation with alerts
- **Form Reset** - Automatic form reset after successful save

### 11.5 Report Types Implemented

| Report | Description | Charts/Features |
|--------|-------------|-----------------|
| **Overview** | Budget summary, top 5 expenses by sub-category | Progress bar, Summary cards |
| **Category Breakdown** | Spending by category with visual comparison | Pie chart, Bar chart, Detailed list |
| **Monthly Trend** | 6-month spending/received trend | Line chart, Monthly summary table |
| **Party Ledger** | Individual party statement (bank-style) | Debit/Credit columns, Running balance, PDF/CSV export |
| **Company Ledger** | Full transaction history with filters | Date range filter, Type filter (All/Purchases/Payments), PDF/CSV export |

### 11.5.1 Export Formats
| Format | Available In | Contents |
|--------|--------------|----------|
| **CSV** | Transactions, Party Ledger, Company Ledger | Full data with headers |
| **JSON** | Reports, Settings Backup | Complete data structure |
| **PDF** | Party Ledger, Company Ledger | Professional formatted report with header, totals, summary boxes |

### 11.5.2 PDF Report Features
- **Professional Header** - Project name, statement date, account info
- **Styled Tables** - Alternating row colors, column alignment
- **Summary Boxes** - Total Debit, Total Credit, Net Balance
- **Footer Notes** - Dr/Cr explanation, generation timestamp
- **Indian Number Format** - Locale-aware formatting (Lakhs, Crores)

### 11.6 Data Storage Schema (LocalStorage)

```javascript
// Keys used in LocalStorage
rojmel_transactions  // Array of transaction objects
rojmel_parties       // Array of party objects
rojmel_categories    // Array of category definitions
rojmel_settings      // Project settings object
```

### 11.6.1 Transaction Object Schema
```javascript
{
  id: "TXN1704067200000",        // Auto-generated ID
  date: "2024-01-15",            // YYYY-MM-DD format
  voucherNo: "V-202401-123",     // Auto-generated voucher
  partyId: "PARTY1704067200000", // Reference to party
  partyName: "Ramesh Supplier",  // Denormalized party name
  description: "50 bags cement", // Transaction description
  category: "materials",         // Category ID
  subCategory: "Cement",         // Sub-category name
  type: "purchase",              // purchase | payment | income
  purchaseAmount: 17500,         // For credit purchases
  credit: 0,                     // Money paid out
  debit: 0,                      // Money received
  paymentMode: "Credit",         // Cash | Bank Transfer | UPI | Cheque | Credit
  reference: "INV-1234",         // Invoice/Bill reference
  notes: "Delivered to site",    // Additional notes
  isPaid: false,                 // For purchase tracking
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

### 11.6.2 Party Object Schema
```javascript
{
  id: "PARTY1704067200000",
  name: "Ramesh Cement Supplier",
  type: "supplier",              // supplier | contractor | labor | other
  phone: "9876543210",
  address: "Industrial Area",
  openingBalance: -5000,         // Negative = we owe, Positive = they owe
  currentBalance: -17500,        // Auto-calculated from transactions
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### 11.6.3 Default Categories
```javascript
[
  { id: 'materials', name: 'Materials', icon: '🧱', 
    subcategories: ['Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 'Plumbing', 'Electrical', 'Tiles', 'Paint', 'Hardware'] },
  { id: 'labor', name: 'Labor', icon: '👷', 
    subcategories: ['Mason', 'Helper', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Other'] },
  { id: 'contractor', name: 'Contractor', icon: '🏗️', 
    subcategories: ['Main Contractor', 'Sub-Contractor', 'Architect', 'Engineer'] },
  { id: 'transport', name: 'Transport', icon: '🚚', 
    subcategories: ['Delivery', 'Equipment Rental'] },
  { id: 'misc', name: 'Miscellaneous', icon: '📋', 
    subcategories: ['Permits', 'Utilities', 'Security', 'Food/Tea'] },
  { id: 'income', name: 'Income/Funds', icon: '💰', 
    subcategories: ['Self', 'Bank Loan', 'Family', 'Other'] }
]
```

### 11.6.4 Settings Object Schema
```javascript
{
  budget: 2500000,                    // Total budget in rupees
  projectName: "My Home Construction", // Display name
  currency: "₹",                      // Currency symbol
  dateFormat: "dd-MM-yyyy"            // Date format
}
```

### 11.6.5 Helper Utility Functions
| Function | Purpose |
|----------|---------|
| `formatCurrency(amount)` | Format with ₹, Lakhs (L), Crores (Cr) abbreviation |
| `formatCurrencyFull(amount)` | Format with ₹, full Indian number format |
| `formatDate(date)` | Format to dd-MM-yyyy |
| `formatDateDisplay(date)` | Format to "dd MMM yyyy" |
| `getToday()` | Get today in yyyy-MM-dd format |
| `generateVoucherNo()` | Generate V-YYYYMM-XXX format |
| `calculateRunningBalance(txns)` | Calculate running balance for ledger |
| `groupByDate(txns)` | Group transactions by date |
| `filterTransactions(txns, filters)` | Apply search/category/party/date/type filters |

### 11.7 Party (Khata) Management Features

| Feature | Description |
|---------|-------------|
| **Party Types** | Supplier, Contractor, Labor, Other |
| **Party Details** | Name, Type, Phone, Address, Opening Balance |
| **Balance Tracking** | Automatic calculation from transactions |
| **Filter Options** | All, We Owe, They Owe, By Type |
| **Summary Cards** | Total "We Owe" and "They Owe" amounts |
| **Party Details Modal** | View info, transaction history, edit opening balance |
| **Quick Ledger Access** | Direct link to full party ledger |
| **Delete Protection** | Cannot delete party with existing transactions |

### 11.8 Transactions Page Features

| Feature | Description |
|---------|-------------|
| **Search** | Real-time search by party name, description, voucher no |
| **Filters** | By Category, Party, Type (Expense/Income), Date Range |
| **Summary Cards** | Total entries, Total received, Total paid |
| **Expandable Rows** | Click to view voucher, category, payment mode, reference, notes |
| **Delete Option** | Delete individual transactions with confirmation |
| **CSV Export** | Export filtered transactions |
| **Category Icons** | Visual emoji icons for each category |

### 11.9 Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Quick Add Button** | Prominent green button to add new entry |
| **Stats Cards** | Spent, Received, Budget, Remaining (color-coded) |
| **Budget Progress** | Visual progress bar with percentage |
| **Category Pie Chart** | Interactive chart with tooltips |
| **Outstanding Balances** | List of parties with non-zero balance |
| **Recent Transactions** | Last 5 transactions with quick view |

### 11.10 Settings Page Features

| Feature | Description |
|---------|-------------|
| **Project Name** | Customizable project title |
| **Budget Setting** | Set total construction budget |
| **Data Statistics** | Count of transactions and parties |
| **Export Backup** | Download JSON backup file |
| **Import Backup** | Restore from JSON backup with confirmation |
| **Clear All Data** | Delete everything with double confirmation |
| **App Version** | Display current version (1.0.0) |

### 11.11 UI/UX Features

- **Responsive Design**: Mobile-first with desktop breakpoints (md:)
- **Bottom Navigation**: Fixed mobile nav bar with 5 main sections
- **Top Header**: Gradient header with project name and desktop nav
- **Quick Add Button**: Prominent CTA on dashboard
- **Indian Currency Format**: ₹ with Lakhs (L) / Crores (Cr) abbreviation
- **Color-coded Transactions**: Red (expenses), Green (income/payments), Orange (purchases)
- **Real-time Balance Updates**: Party balances recalculate on every transaction
- **Modals**: Add party, Party details, Filters
- **Loading States**: "Saving..." button states during operations
- **Confirmation Dialogs**: Delete confirmations with browser confirm()
- **Print Support**: Print-friendly CSS for Party Ledger
- **Touch-friendly**: Large touch targets for mobile

---

### 11.12 Navigation Structure

```
📱 Mobile Navigation (Bottom Bar)
├── 🏠 Dashboard
├── ➕ Entries (Entry Selector)
│   ├── 🛒 Purchase Entry
│   ├── 💵 Payment Entry
│   └── 💰 Receipt/Income
├── 📋 Transactions
├── 👥 Parties
│   └── 📄 Party Ledger (per party)
└── 📊 Reports
    └── 📑 Company Ledger

⚙️ Settings (Desktop nav only on mobile bottom)
```

### 11.13 Balance Calculation Logic

```javascript
// Party Balance Calculation
openingBalance + totalPurchases - totalPayments = currentBalance

// If currentBalance < 0: "We owe them"
// If currentBalance > 0: "They owe us"
// If currentBalance = 0: "Settled"

// Ledger Running Balance
runningBalance = openingBalance
for each transaction:
  runningBalance = runningBalance - debit + credit
  // debit = purchase amount (increases debt)
  // credit = payment amount (decreases debt)
```

### 11.14 Payment Modes Supported

| Mode | Icon | Used In |
|------|------|---------|
| Cash | 💵 | All entry types |
| Bank Transfer | 🏦 | All entry types |
| UPI | 📱 | All entry types |
| Cheque | 📝 | All entry types |
| Credit | 🔄 | Purchase entry (default) |

---

## 12. Future Enhancements (Roadmap)

### Priority 1 - High
- [x] Multi-project support (switch between construction projects) ✅
- [x] Bill/Receipt photo attachment (camera + gallery) ✅
- [ ] Recurring transaction templates
- [ ] WhatsApp/SMS payment reminders
- [x] Transaction edit functionality ✅
- [x] PWA installation support ✅

### Priority 2 - Medium
- [ ] Hindi/Gujarati language support
- [ ] Cloud sync (Google Drive/Firebase)
- [x] Service worker for offline-first ✅
- [ ] Bulk import from Excel/CSV
- [ ] Custom categories management
- [ ] Party contact save to phone

### Priority 3 - Low
- [ ] Voice input for quick entries
- [ ] Material inventory tracking with stock alerts
- [ ] Worker attendance tracking
- [ ] Construction progress photos timeline
- [ ] Dark mode theme
- [ ] Desktop app (Electron)

---

## 13. Running the Application

```bash
# Navigate to app folder
cd app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Default URL**: http://localhost:5173

---

## Next Steps

The application is now fully functional with Phase 1 and Phase 2 features complete. Future development can focus on:
1. **Multi-project support** for managing multiple construction sites
2. **Cloud backup** for data safety across devices
3. **Photo attachments** for bills and receipts
4. **Regional language support** (Hindi/Gujarati)
