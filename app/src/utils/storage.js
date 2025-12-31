// Local Storage Keys
const STORAGE_KEYS = {
  PROJECTS: 'rojmel_projects',
  ACTIVE_PROJECT: 'rojmel_active_project',
  TRANSACTIONS: 'rojmel_transactions',
  PARTIES: 'rojmel_parties',
  CATEGORIES: 'rojmel_categories',
  SETTINGS: 'rojmel_settings'
};

// Get project-specific key
function getProjectKey(baseKey) {
  const activeProject = getActiveProject();
  if (!activeProject) return baseKey;
  return `${baseKey}_${activeProject.id}`;
}

// Default Categories for Construction
const DEFAULT_CATEGORIES = [
  { id: 'materials', name: 'Materials', icon: '🧱', subcategories: ['Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 'Plumbing', 'Electrical', 'Tiles', 'Paint', 'Hardware'] },
  { id: 'labor', name: 'Labor', icon: '👷', subcategories: ['Mason', 'Helper', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Other'] },
  { id: 'contractor', name: 'Contractor', icon: '🏗️', subcategories: ['Main Contractor', 'Sub-Contractor', 'Architect', 'Engineer'] },
  { id: 'transport', name: 'Transport', icon: '🚚', subcategories: ['Delivery', 'Equipment Rental'] },
  { id: 'misc', name: 'Miscellaneous', icon: '📋', subcategories: ['Permits', 'Utilities', 'Security', 'Food/Tea'] },
  { id: 'income', name: 'Income/Funds', icon: '💰', subcategories: ['Self', 'Bank Loan', 'Family', 'Other'] }
];

// Default Settings
const DEFAULT_SETTINGS = {
  budget: 2500000,
  projectName: 'My Home Construction',
  currency: '₹',
  dateFormat: 'dd-MM-yyyy'
};

// ==================== PROJECT MANAGEMENT ====================

// Get all projects
export function getProjects() {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
}

// Get active project
export function getActiveProject() {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
  return data ? JSON.parse(data) : null;
}

// Set active project
export function setActiveProject(project) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, JSON.stringify(project));
}

// Create new project
export function createProject(name, budget = 2500000) {
  const projects = getProjects();
  const newProject = {
    id: `PROJ${Date.now()}`,
    name: name,
    budget: budget,
    createdAt: new Date().toISOString()
  };
  projects.push(newProject);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  
  // Initialize project-specific data
  const projectSettings = { ...DEFAULT_SETTINGS, projectName: name, budget: budget };
  localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${newProject.id}`, JSON.stringify(projectSettings));
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${newProject.id}`, JSON.stringify([]));
  localStorage.setItem(`${STORAGE_KEYS.PARTIES}_${newProject.id}`, JSON.stringify([]));
  localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${newProject.id}`, JSON.stringify(DEFAULT_CATEGORIES));
  
  return newProject;
}

// Delete project
export function deleteProject(projectId) {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
  
  // Clean up project data
  localStorage.removeItem(`${STORAGE_KEYS.SETTINGS}_${projectId}`);
  localStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS}_${projectId}`);
  localStorage.removeItem(`${STORAGE_KEYS.PARTIES}_${projectId}`);
  localStorage.removeItem(`${STORAGE_KEYS.CATEGORIES}_${projectId}`);
  
  // If deleted active project, switch to another or null
  const active = getActiveProject();
  if (active?.id === projectId) {
    if (filtered.length > 0) {
      setActiveProject(filtered[0]);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
    }
  }
}

// Update project
export function updateProject(projectId, updates) {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    // Update active project if it's the one being updated
    const active = getActiveProject();
    if (active?.id === projectId) {
      setActiveProject(projects[index]);
    }
  }
  return projects[index];
}

// ==================== INITIALIZATION ====================

// Initialize default data if not exists
export function initializeData() {
  // Check for existing data (migration from single project)
  const existingTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const existingParties = localStorage.getItem(STORAGE_KEYS.PARTIES);
  const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  
  // If no projects exist, create default project
  let projects = getProjects();
  if (projects.length === 0) {
    // Migrate existing data to first project
    const defaultProject = {
      id: 'PROJ_DEFAULT',
      name: existingSettings ? JSON.parse(existingSettings).projectName || 'My Home Construction' : 'My Home Construction',
      budget: existingSettings ? JSON.parse(existingSettings).budget || 2500000 : 2500000,
      createdAt: new Date().toISOString()
    };
    projects = [defaultProject];
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    // Migrate existing data to project-specific keys
    if (existingTransactions) {
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${defaultProject.id}`, existingTransactions);
    } else {
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${defaultProject.id}`, JSON.stringify([]));
    }
    
    if (existingParties) {
      localStorage.setItem(`${STORAGE_KEYS.PARTIES}_${defaultProject.id}`, existingParties);
    } else {
      localStorage.setItem(`${STORAGE_KEYS.PARTIES}_${defaultProject.id}`, JSON.stringify([]));
    }
    
    if (existingSettings) {
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${defaultProject.id}`, existingSettings);
    } else {
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${defaultProject.id}`, JSON.stringify(DEFAULT_SETTINGS));
    }
    
    localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${defaultProject.id}`, JSON.stringify(DEFAULT_CATEGORIES));
  }
  
  // Set active project if not set
  if (!getActiveProject() && projects.length > 0) {
    setActiveProject(projects[0]);
  }
}

// ==================== TRANSACTIONS ====================

export function getTransactions() {
  const key = getProjectKey(STORAGE_KEYS.TRANSACTIONS);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveTransaction(transaction) {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: `TXN${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTransaction);
  const key = getProjectKey(STORAGE_KEYS.TRANSACTIONS);
  localStorage.setItem(key, JSON.stringify(transactions));
  
  // Update party balance
  if (transaction.partyId) {
    updatePartyBalance(transaction.partyId);
  }
  
  return newTransaction;
}

export function updateTransaction(id, updates) {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    const key = getProjectKey(STORAGE_KEYS.TRANSACTIONS);
    localStorage.setItem(key, JSON.stringify(transactions));
  }
  return transactions[index];
}

export function deleteTransaction(id) {
  const transactions = getTransactions();
  const transaction = transactions.find(t => t.id === id);
  const filtered = transactions.filter(t => t.id !== id);
  const key = getProjectKey(STORAGE_KEYS.TRANSACTIONS);
  localStorage.setItem(key, JSON.stringify(filtered));
  
  if (transaction?.partyId) {
    updatePartyBalance(transaction.partyId);
  }
}

// ==================== PARTIES ====================

export function getParties() {
  const key = getProjectKey(STORAGE_KEYS.PARTIES);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function getPartyById(id) {
  const parties = getParties();
  return parties.find(p => p.id === id);
}

export function saveParty(party) {
  const parties = getParties();
  const newParty = {
    ...party,
    id: `PARTY${Date.now()}`,
    currentBalance: party.openingBalance || 0,
    createdAt: new Date().toISOString()
  };
  parties.push(newParty);
  const key = getProjectKey(STORAGE_KEYS.PARTIES);
  localStorage.setItem(key, JSON.stringify(parties));
  return newParty;
}

export function updateParty(id, updates) {
  const parties = getParties();
  const index = parties.findIndex(p => p.id === id);
  if (index !== -1) {
    parties[index] = { ...parties[index], ...updates };
    const key = getProjectKey(STORAGE_KEYS.PARTIES);
    localStorage.setItem(key, JSON.stringify(parties));
  }
  return parties[index];
}

export function deleteParty(id) {
  const parties = getParties();
  const filtered = parties.filter(p => p.id !== id);
  const key = getProjectKey(STORAGE_KEYS.PARTIES);
  localStorage.setItem(key, JSON.stringify(filtered));
}

export function updatePartyBalance(partyId) {
  const transactions = getTransactions();
  const partyTransactions = transactions.filter(t => t.partyId === partyId);
  
  // Calculate balance: purchases increase debt, payments decrease debt
  const totals = partyTransactions.reduce((acc, t) => {
    const purchase = parseFloat(t.purchaseAmount) || 0;
    const payment = parseFloat(t.credit) || 0;
    return {
      purchases: acc.purchases + purchase,
      payments: acc.payments + payment
    };
  }, { purchases: 0, payments: 0 });
  
  const parties = getParties();
  const party = parties.find(p => p.id === partyId);
  if (party) {
    // Negative balance = we owe them, Positive = they owe us
    const openingBalance = parseFloat(party.openingBalance) || 0;
    const currentBalance = openingBalance - totals.purchases + totals.payments;
    updateParty(partyId, { currentBalance });
  }
}

// ==================== CATEGORIES ====================

export function getCategories() {
  const key = getProjectKey(STORAGE_KEYS.CATEGORIES);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

// ==================== SETTINGS ====================

export function getSettings() {
  const key = getProjectKey(STORAGE_KEYS.SETTINGS);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function updateSettings(updates) {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  const key = getProjectKey(STORAGE_KEYS.SETTINGS);
  localStorage.setItem(key, JSON.stringify(newSettings));
  
  // Also update project name in projects list if changed
  if (updates.projectName) {
    const active = getActiveProject();
    if (active) {
      updateProject(active.id, { name: updates.projectName });
    }
  }
  if (updates.budget !== undefined) {
    const active = getActiveProject();
    if (active) {
      updateProject(active.id, { budget: updates.budget });
    }
  }
  
  return newSettings;
}

// Statistics
export function getStats() {
  const transactions = getTransactions();
  const settings = getSettings();
  
  const budget = settings.budget || 0;
  const totalCredit = transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);
  const totalDebit = transactions.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);
  
  const categoryWise = {};
  transactions.forEach(t => {
    if (t.category && t.category !== 'income') {
      if (!categoryWise[t.category]) {
        categoryWise[t.category] = 0;
      }
      categoryWise[t.category] += (parseFloat(t.credit) || 0);
    }
  });
  
  // Calculate percent used, handle division by zero
  let percentUsed = 0;
  if (budget > 0) {
    percentUsed = Math.round((totalCredit / budget) * 100);
  }
  
  return {
    totalSpent: totalCredit,
    totalReceived: totalDebit,
    budget: budget,
    remaining: budget - totalCredit,
    percentUsed: isNaN(percentUsed) ? 0 : percentUsed,
    categoryWise
  };
}

// Export data
export function exportData() {
  return {
    transactions: getTransactions(),
    parties: getParties(),
    categories: getCategories(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
}

// Import data
export function importData(data) {
  if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
  if (data.parties) localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(data.parties));
  if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
  if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
}
