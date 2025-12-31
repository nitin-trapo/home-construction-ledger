// Local Storage Keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'rojmel_transactions',
  PARTIES: 'rojmel_parties',
  CATEGORIES: 'rojmel_categories',
  SETTINGS: 'rojmel_settings'
};

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

// Initialize default data if not exists
export function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PARTIES)) {
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify([]));
  }
}

// Transactions
export function getTransactions() {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
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
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  
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
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }
  return transactions[index];
}

export function deleteTransaction(id) {
  const transactions = getTransactions();
  const transaction = transactions.find(t => t.id === id);
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
  
  if (transaction?.partyId) {
    updatePartyBalance(transaction.partyId);
  }
}

// Parties
export function getParties() {
  const data = localStorage.getItem(STORAGE_KEYS.PARTIES);
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
  localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
  return newParty;
}

export function updateParty(id, updates) {
  const parties = getParties();
  const index = parties.findIndex(p => p.id === id);
  if (index !== -1) {
    parties[index] = { ...parties[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
  }
  return parties[index];
}

export function deleteParty(id) {
  const parties = getParties();
  const filtered = parties.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(filtered));
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

// Categories
export function getCategories() {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

// Settings
export function getSettings() {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function updateSettings(updates) {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
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
