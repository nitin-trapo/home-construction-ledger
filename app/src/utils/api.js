// API client for SQLite backend
const API_BASE = import.meta.env.PROD 
  ? '/danev/api' 
  : 'http://localhost:3001/api';

// Active project state
let activeProjectId = null;

// Get auth token
function getToken() {
  return localStorage.getItem('rojmel_token');
}

// Auth headers helper
function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ==================== AUTH ====================

export function isAuthenticated() {
  return !!getToken();
}

export function getCurrentUser() {
  const user = localStorage.getItem('rojmel_user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('rojmel_token');
  localStorage.removeItem('rojmel_user');
  localStorage.removeItem('rojmel_active_project');
}

export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create user');
  }
  return data;
}

export async function updateUser(id, userData) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(userData)
  });
  return res.json();
}

export async function deleteUser(id) {
  await fetch(`${API_BASE}/users/${id}`, { 
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function assignProjectToUser(userId, projectId, role = 'editor') {
  const res = await fetch(`${API_BASE}/users/${userId}/projects/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to assign project');
  }
  return data;
}

export async function removeProjectFromUser(userId, projectId) {
  await fetch(`${API_BASE}/users/${userId}/projects/${projectId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

// ==================== PROJECTS ====================

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: authHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error('Failed to fetch projects');
  }
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

export async function createProject(name, budget = 2500000, assignToUser = null) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, budget, assignToUser })
  });
  return res.json();
}

export async function deleteProject(projectId) {
  await fetch(`${API_BASE}/projects/${projectId}`, { 
    method: 'DELETE',
    headers: authHeaders()
  });
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  const project = getActiveProject();
  if (!project) return [];
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/transactions`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function saveTransaction(transaction) {
  const project = getActiveProject();
  if (!project) throw new Error('No active project');
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(transaction)
  });
  return res.json();
}

export async function updateTransaction(id, updates) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteTransaction(id) {
  await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE', headers: authHeaders() });
}

// ==================== PARTIES ====================

export async function getParties() {
  const project = getActiveProject();
  if (!project) return [];
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/parties`, { headers: authHeaders() });
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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(party)
  });
  return res.json();
}

export async function updateParty(id, updates) {
  const res = await fetch(`${API_BASE}/parties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteParty(id) {
  await fetch(`${API_BASE}/parties/${id}`, { method: 'DELETE', headers: authHeaders() });
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
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/categories`, { headers: authHeaders() });
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
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/settings`, { headers: authHeaders() });
  return res.json();
}

export async function updateSettings(updates) {
  const project = getActiveProject();
  if (!project) throw new Error('No active project');
  
  const res = await fetch(`${API_BASE}/projects/${project.id}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
