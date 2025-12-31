import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import { db, DEFAULT_CATEGORIES } from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rojmel-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==================== AUTH HELPERS ====================

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
  
  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ==================== AUTH ENDPOINTS ====================

// Register (first user becomes superadmin)
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password and name are required' });
    }
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // First user becomes superadmin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const role = userCount.count === 0 ? 'superadmin' : 'user';
    
    const id = `USER${Date.now()}`;
    const hashedPassword = hashPassword(password);
    
    db.prepare(`
      INSERT INTO users (id, username, email, password, name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username, email || null, hashedPassword, name, role);
    
    const user = db.prepare('SELECT id, username, name, email, role FROM users WHERE id = ?').get(id);
    const token = generateToken(user);
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, name, email, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER MANAGEMENT (Admin only) ====================

// Get all users
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, email, role, is_active, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin only)
app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const { username, password, name, email, role = 'user' } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password and name are required' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const id = `USER${Date.now()}`;
    const hashedPassword = hashPassword(password);
    
    db.prepare(`
      INSERT INTO users (id, username, email, password, name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username, email || null, hashedPassword, name, role);
    
    const user = db.prepare('SELECT id, username, name, email, role, is_active FROM users WHERE id = ?').get(id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const { name, email, role, is_active } = req.body;
    
    db.prepare(`
      UPDATE users SET name = ?, email = ?, role = ?, is_active = ?
      WHERE id = ?
    `).run(name, email, role, is_active ? 1 : 0, req.params.id);
    
    const user = db.prepare('SELECT id, username, name, email, role, is_active FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign project to user
app.post('/api/users/:userId/projects/:projectId', authMiddleware, adminOnly, (req, res) => {
  try {
    const { role = 'editor' } = req.body;
    
    db.prepare(`
      INSERT OR REPLACE INTO user_projects (user_id, project_id, role)
      VALUES (?, ?, ?)
    `).run(req.params.userId, req.params.projectId, role);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove project from user
app.delete('/api/users/:userId/projects/:projectId', authMiddleware, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM user_projects WHERE user_id = ? AND project_id = ?').run(req.params.userId, req.params.projectId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's assigned projects
app.get('/api/users/:userId/projects', authMiddleware, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, up.role as user_role 
      FROM projects p
      JOIN user_projects up ON p.id = up.project_id
      WHERE up.user_id = ?
    `).all(req.params.userId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==================== PROJECTS ====================

// Get all projects (for superadmin) or user's assigned projects
app.get('/api/projects', authMiddleware, (req, res) => {
  try {
    let projects;
    if (req.user.role === 'superadmin') {
      // Superadmin sees all projects
      projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    } else {
      // Regular users see only assigned projects
      projects = db.prepare(`
        SELECT p.* FROM projects p
        JOIN user_projects up ON p.id = up.project_id
        WHERE up.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project (superadmin only)
app.post('/api/projects', authMiddleware, adminOnly, (req, res) => {
  try {
    const { name, budget = 2500000, assignToUser } = req.body;
    const id = `PROJ${Date.now()}`;
    
    db.prepare('INSERT INTO projects (id, name, budget, created_by) VALUES (?, ?, ?, ?)').run(id, name, budget, req.user.id);
    
    // Initialize default categories for this project
    const insertCategory = db.prepare('INSERT INTO categories (id, project_id, name, icon, subcategories) VALUES (?, ?, ?, ?, ?)');
    DEFAULT_CATEGORIES.forEach(cat => {
      insertCategory.run(`${cat.id}_${id}`, id, cat.name, cat.icon, cat.subcategories);
    });
    
    // Initialize settings
    db.prepare('INSERT INTO settings (project_id, budget, project_name) VALUES (?, ?, ?)').run(id, budget, name);
    
    // If assignToUser specified, assign project to that user
    if (assignToUser) {
      db.prepare('INSERT INTO user_projects (user_id, project_id, role) VALUES (?, ?, ?)').run(assignToUser, id, 'editor');
    }
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project (superadmin only)
app.delete('/api/projects/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSACTIONS ====================

// Get transactions for a project
app.get('/api/projects/:projectId/transactions', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE project_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(req.params.projectId);
    
    // Convert snake_case to camelCase
    const formatted = transactions.map(t => ({
      id: t.id,
      projectId: t.project_id,
      date: t.date,
      voucherNo: t.voucher_no,
      partyId: t.party_id,
      partyName: t.party_name,
      description: t.description,
      category: t.category,
      subCategory: t.sub_category,
      type: t.type,
      purchaseAmount: t.purchase_amount,
      credit: t.credit,
      debit: t.debit,
      paymentMode: t.payment_mode,
      reference: t.reference,
      notes: t.notes,
      isPaid: !!t.is_paid,
      hasAttachment: !!t.has_attachment,
      createdAt: t.created_at
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post('/api/projects/:projectId/transactions', (req, res) => {
  try {
    const { projectId } = req.params;
    const t = req.body;
    const id = `TXN${Date.now()}`;
    
    db.prepare(`
      INSERT INTO transactions (
        id, project_id, date, voucher_no, party_id, party_name, 
        description, category, sub_category, type, purchase_amount, 
        credit, debit, payment_mode, reference, notes, is_paid, has_attachment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, projectId, t.date, t.voucherNo, t.partyId, t.partyName,
      t.description, t.category, t.subCategory, t.type, t.purchaseAmount || 0,
      t.credit || 0, t.debit || 0, t.paymentMode, t.reference, t.notes, 
      t.isPaid ? 1 : 0, t.hasAttachment ? 1 : 0
    );
    
    // Update party balance if party exists
    if (t.partyId) {
      updatePartyBalance(t.partyId);
    }
    
    res.json({ id, ...t });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
  try {
    const t = req.body;
    
    db.prepare(`
      UPDATE transactions SET
        date = ?, voucher_no = ?, description = ?, category = ?, 
        sub_category = ?, purchase_amount = ?, credit = ?, debit = ?,
        payment_mode = ?, reference = ?, notes = ?
      WHERE id = ?
    `).run(
      t.date, t.voucherNo, t.description, t.category, t.subCategory,
      t.purchaseAmount || 0, t.credit || 0, t.debit || 0,
      t.paymentMode, t.reference, t.notes, req.params.id
    );
    
    // Update party balance
    const txn = db.prepare('SELECT party_id FROM transactions WHERE id = ?').get(req.params.id);
    if (txn?.party_id) {
      updatePartyBalance(txn.party_id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const txn = db.prepare('SELECT party_id FROM transactions WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    
    if (txn?.party_id) {
      updatePartyBalance(txn.party_id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PARTIES ====================

// Get parties for a project
app.get('/api/projects/:projectId/parties', (req, res) => {
  try {
    const parties = db.prepare(`
      SELECT * FROM parties 
      WHERE project_id = ? 
      ORDER BY name ASC
    `).all(req.params.projectId);
    
    const formatted = parties.map(p => ({
      id: p.id,
      projectId: p.project_id,
      name: p.name,
      type: p.type,
      phone: p.phone,
      address: p.address,
      openingBalance: p.opening_balance,
      currentBalance: p.current_balance,
      createdAt: p.created_at
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create party
app.post('/api/projects/:projectId/parties', (req, res) => {
  try {
    const { projectId } = req.params;
    const p = req.body;
    const id = `PARTY${Date.now()}`;
    
    db.prepare(`
      INSERT INTO parties (id, project_id, name, type, phone, address, opening_balance, current_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, projectId, p.name, p.type || 'supplier', p.phone, p.address, p.openingBalance || 0, p.openingBalance || 0);
    
    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(id);
    res.json({
      id: party.id,
      name: party.name,
      type: party.type,
      phone: party.phone,
      address: party.address,
      openingBalance: party.opening_balance,
      currentBalance: party.current_balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update party
app.put('/api/parties/:id', (req, res) => {
  try {
    const p = req.body;
    db.prepare(`
      UPDATE parties SET name = ?, type = ?, phone = ?, address = ?, opening_balance = ?
      WHERE id = ?
    `).run(p.name, p.type, p.phone, p.address, p.openingBalance || 0, req.params.id);
    
    updatePartyBalance(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete party
app.delete('/api/parties/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM parties WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update party balance
function updatePartyBalance(partyId) {
  const party = db.prepare('SELECT opening_balance FROM parties WHERE id = ?').get(partyId);
  if (!party) return;
  
  const result = db.prepare(`
    SELECT 
      COALESCE(SUM(purchase_amount), 0) as purchases,
      COALESCE(SUM(credit), 0) as payments
    FROM transactions 
    WHERE party_id = ?
  `).get(partyId);
  
  const currentBalance = (party.opening_balance || 0) - (result.purchases || 0) + (result.payments || 0);
  db.prepare('UPDATE parties SET current_balance = ? WHERE id = ?').run(currentBalance, partyId);
}

// ==================== CATEGORIES ====================

app.get('/api/projects/:projectId/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE project_id = ?').all(req.params.projectId);
    
    const formatted = categories.map(c => ({
      id: c.id.split('_')[0],
      name: c.name,
      icon: c.icon,
      subcategories: JSON.parse(c.subcategories || '[]')
    }));
    
    // If no categories, return defaults
    if (formatted.length === 0) {
      return res.json(DEFAULT_CATEGORIES.map(c => ({
        ...c,
        subcategories: JSON.parse(c.subcategories)
      })));
    }
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SETTINGS ====================

app.get('/api/projects/:projectId/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE project_id = ?').get(req.params.projectId);
    
    if (!settings) {
      return res.json({
        budget: 2500000,
        projectName: 'My Home Construction',
        currency: '₹',
        dateFormat: 'dd-MM-yyyy'
      });
    }
    
    res.json({
      budget: settings.budget,
      projectName: settings.project_name,
      currency: settings.currency,
      dateFormat: settings.date_format
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectId/settings', (req, res) => {
  try {
    const { projectId } = req.params;
    const s = req.body;
    
    db.prepare(`
      INSERT INTO settings (project_id, budget, project_name, currency, date_format)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        budget = ?, project_name = ?, currency = ?, date_format = ?
    `).run(
      projectId, s.budget, s.projectName, s.currency || '₹', s.dateFormat || 'dd-MM-yyyy',
      s.budget, s.projectName, s.currency || '₹', s.dateFormat || 'dd-MM-yyyy'
    );
    
    // Also update project name and budget
    db.prepare('UPDATE projects SET name = ?, budget = ? WHERE id = ?').run(s.projectName, s.budget, projectId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ATTACHMENTS ====================

app.post('/api/transactions/:transactionId/attachment', (req, res) => {
  try {
    const { transactionId } = req.params;
    const { imageData } = req.body;
    
    // Delete existing attachment
    db.prepare('DELETE FROM attachments WHERE transaction_id = ?').run(transactionId);
    
    // Insert new attachment
    db.prepare('INSERT INTO attachments (transaction_id, image_data) VALUES (?, ?)').run(transactionId, imageData);
    
    // Update transaction flag
    db.prepare('UPDATE transactions SET has_attachment = 1 WHERE id = ?').run(transactionId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions/:transactionId/attachment', (req, res) => {
  try {
    const attachment = db.prepare('SELECT image_data FROM attachments WHERE transaction_id = ?').get(req.params.transactionId);
    res.json({ imageData: attachment?.image_data || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transactions/:transactionId/attachment', (req, res) => {
  try {
    db.prepare('DELETE FROM attachments WHERE transaction_id = ?').run(req.params.transactionId);
    db.prepare('UPDATE transactions SET has_attachment = 0 WHERE id = ?').run(req.params.transactionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ====================

app.get('/api/projects/:projectId/stats', (req, res) => {
  try {
    const { projectId } = req.params;
    
    const settings = db.prepare('SELECT budget FROM settings WHERE project_id = ?').get(projectId);
    const budget = settings?.budget || 2500000;
    
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(credit), 0) as total_credit,
        COALESCE(SUM(debit), 0) as total_debit
      FROM transactions 
      WHERE project_id = ?
    `).get(projectId);
    
    const categoryWise = db.prepare(`
      SELECT category, SUM(credit) as total
      FROM transactions 
      WHERE project_id = ? AND category != 'income' AND category IS NOT NULL
      GROUP BY category
    `).all(projectId);
    
    const categoryData = {};
    categoryWise.forEach(c => {
      categoryData[c.category] = c.total || 0;
    });
    
    const percentUsed = budget > 0 ? Math.round((totals.total_credit / budget) * 100) : 0;
    
    res.json({
      totalSpent: totals.total_credit,
      totalReceived: totals.total_debit,
      budget,
      remaining: budget - totals.total_credit,
      percentUsed,
      categoryWise: categoryData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Rojmel API Server running on http://localhost:${PORT}`);
  console.log(`📁 SQLite database: rojmel.db`);
});
