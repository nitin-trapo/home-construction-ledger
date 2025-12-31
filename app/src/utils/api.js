// API client for SQLite backend
const API_BASE = 'http://localhost:3001/api';

// Active project state
let activeProjectId = null;

// ==================== PROJECTS ====================

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export function getActiveProject() {
  const stored = localStorage.getItem('rojmel_active_project');
  return stored ? JSON.parse(stored) : null;
}

export function setActiveProject(project) {
  activeProjectId = project?.id;
  localStorage.setItem('rojmel_active_project', JSON.stringify(project));
}

export async function createProject(name, budget = 2500000) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, budget })
  });
  return res.json();
}

export async function deleteProject(projectId) {
  await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  const project = getActiveProject();
  if (!project) return [];
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/transactions`);
  return res.json();
}

export async function saveTransaction(transaction) {
  const project = getActiveProject();
  if (!project) throw new Error('No active project');
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  return res.json();
}

export async function updateTransaction(id, updates) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteTransaction(id) {
  await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
}

// ==================== PARTIES ====================

export async function getParties() {
  const project = getActiveProject();
  if (!project) return [];
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/parties`);
  return res.json();
}

export async function getPartyById(id) {
  const parties = await getParties();
  return parties.find(p => p.id === id);
}

export async function saveParty(party) {
  const project = getActiveProject();
  if (!project) throw new Error('No active project');
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(party)
  });
  return res.json();
}

export async function updateParty(id, updates) {
  const res = await fetch(`${API_BASE}/parties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteParty(id) {
  await fetch(`${API_BASE}/parties/${id}`, { method: 'DELETE' });
}

export async function updatePartyBalance(partyId) {
  // Balance is updated on server side automatically
  return true;
}

// ==================== CATEGORIES ====================

export async function getCategories() {
  const project = getActiveProject();
  if (!project) {
    return [
      { id: 'materials', name: 'Materials', icon: '🧱', subcategories: ['Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 'Plumbing', 'Electrical', 'Tiles', 'Paint', 'Hardware'] },
      { id: 'labor', name: 'Labor', icon: '👷', subcategories: ['Mason', 'Helper', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Other'] },
      { id: 'contractor', name: 'Contractor', icon: '🏗️', subcategories: ['Main Contractor', 'Sub-Contractor', 'Architect', 'Engineer'] },
      { id: 'transport', name: 'Transport', icon: '🚚', subcategories: ['Delivery', 'Equipment Rental'] },
      { id: 'misc', name: 'Miscellaneous', icon: '📋', subcategories: ['Permits', 'Utilities', 'Security', 'Food/Tea'] },
      { id: 'income', name: 'Income/Funds', icon: '💰', subcategories: ['Self', 'Bank Loan', 'Family', 'Other'] }
    ];
  }
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/categories`);
  return res.json();
}

// ==================== SETTINGS ====================

export async function getSettings() {
  const project = getActiveProject();
  if (!project) {
    return {
      budget: 2500000,
      projectName: 'My Home Construction',
      currency: '₹',
      dateFormat: 'dd-MM-yyyy'
    };
  }
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/settings`);
  return res.json();
}

export async function updateSettings(updates) {
  const project = getActiveProject();
  if (!project) throw new Error('No active project');
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

// ==================== STATS ====================

export async function getStats() {
  const project = getActiveProject();
  if (!project) {
    return {
      totalSpent: 0,
      totalReceived: 0,
      budget: 2500000,
      remaining: 2500000,
      percentUsed: 0,
      categoryWise: {}
    };
  }
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/stats`);
  return res.json();
}

// ==================== ATTACHMENTS ====================

export async function saveImage(transactionId, imageData) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/attachment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData })
  });
  return res.json();
}

export async function getImage(transactionId) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/attachment`);
  const data = await res.json();
  return data.imageData;
}

export async function deleteImage(transactionId) {
  await fetch(`${API_BASE}/transactions/${transactionId}/attachment`, { method: 'DELETE' });
}

// ==================== INITIALIZATION ====================

export async function initializeData() {
  try {
    // Check if server is running
    const health = await fetch(`${API_BASE}/health`);
    if (!health.ok) throw new Error('Server not running');
    
    // Get projects
    const projects = await getProjects();
    
    // If no projects exist, create default
    if (projects.length === 0) {
      const project = await createProject('My Home Construction', 2500000);
      setActiveProject(project);
      return;
    }
    
    // Set active project if not set
    const active = getActiveProject();
    if (!active || !projects.find(p => p.id === active.id)) {
      setActiveProject(projects[0]);
    }
  } catch (error) {
    console.error('Failed to connect to server:', error);
    throw error;
  }
}

// ==================== EXPORT/IMPORT ====================

export async function exportData() {
  const project = getActiveProject();
  if (!project) return null;
  
  const [transactions, parties, categories, settings] = await Promise.all([
    getTransactions(),
    getParties(),
    getCategories(),
    getSettings()
  ]);
  
  return {
    project,
    transactions,
    parties,
    categories,
    settings,
    exportedAt: new Date().toISOString()
  };
}

export async function importData(data) {
  // Import is more complex with server - would need bulk import endpoint
  console.warn('Import not yet implemented for server mode');
  return false;
}
