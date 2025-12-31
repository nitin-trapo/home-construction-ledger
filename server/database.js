import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'rojmel.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    budget REAL DEFAULT 2500000,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  -- User-Project assignments (which users can access which projects)
  CREATE TABLE IF NOT EXISTS user_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(user_id, project_id)
  );

  -- Parties table
  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'supplier',
    phone TEXT,
    address TEXT,
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Transactions table
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    date TEXT NOT NULL,
    voucher_no TEXT,
    party_id TEXT,
    party_name TEXT,
    description TEXT,
    category TEXT,
    sub_category TEXT,
    type TEXT,
    purchase_amount REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    debit REAL DEFAULT 0,
    payment_mode TEXT,
    reference TEXT,
    notes TEXT,
    is_paid INTEGER DEFAULT 0,
    has_attachment INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL
  );

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    subcategories TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT UNIQUE NOT NULL,
    budget REAL DEFAULT 2500000,
    project_name TEXT,
    currency TEXT DEFAULT '₹',
    date_format TEXT DEFAULT 'dd-MM-yyyy',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Attachments table (for images)
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    image_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );
`);

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'materials', name: 'Materials', icon: '🧱', subcategories: JSON.stringify(['Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 'Plumbing', 'Electrical', 'Tiles', 'Paint', 'Hardware']) },
  { id: 'labor', name: 'Labor', icon: '👷', subcategories: JSON.stringify(['Mason', 'Helper', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Other']) },
  { id: 'contractor', name: 'Contractor', icon: '🏗️', subcategories: JSON.stringify(['Main Contractor', 'Sub-Contractor', 'Architect', 'Engineer']) },
  { id: 'transport', name: 'Transport', icon: '🚚', subcategories: JSON.stringify(['Delivery', 'Equipment Rental']) },
  { id: 'misc', name: 'Miscellaneous', icon: '📋', subcategories: JSON.stringify(['Permits', 'Utilities', 'Security', 'Food/Tea']) },
  { id: 'income', name: 'Income/Funds', icon: '💰', subcategories: JSON.stringify(['Self', 'Bank Loan', 'Family', 'Other']) }
];

export { db, DEFAULT_CATEGORIES };
