import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { db, DEFAULT_CATEGORIES } from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==================== PROJECTS ====================

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
app.post('/api/projects', (req, res) => {
  try {
    const { name, budget = 2500000 } = req.body;
    const id = `PROJ${Date.now()}`;
    
    db.prepare('INSERT INTO projects (id, name, budget) VALUES (?, ?, ?)').run(id, name, budget);
    
    // Initialize default categories for this project
    const insertCategory = db.prepare('INSERT INTO categories (id, project_id, name, icon, subcategories) VALUES (?, ?, ?, ?, ?)');
    DEFAULT_CATEGORIES.forEach(cat => {
      insertCategory.run(`${cat.id}_${id}`, id, cat.name, cat.icon, cat.subcategories);
    });
    
    // Initialize settings
    db.prepare('INSERT INTO settings (project_id, budget, project_name) VALUES (?, ?, ?)').run(id, budget, name);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
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
