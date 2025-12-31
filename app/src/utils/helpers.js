import { format, parseISO } from 'date-fns';

// Format currency in Indian format (Lakhs, Crores)
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  
  const absAmount = Math.abs(amount);
  let formatted;
  
  if (absAmount >= 10000000) {
    formatted = (absAmount / 10000000).toFixed(2) + ' Cr';
  } else if (absAmount >= 100000) {
    formatted = (absAmount / 100000).toFixed(2) + ' L';
  } else {
    formatted = absAmount.toLocaleString('en-IN');
  }
  
  return (amount < 0 ? '-₹' : '₹') + formatted;
}

// Format currency full (without abbreviation)
export function formatCurrencyFull(amount) {
  if (amount === undefined || amount === null) return '₹0';
  const prefix = amount < 0 ? '-₹' : '₹';
  return prefix + Math.abs(amount).toLocaleString('en-IN');
}

// Format date
export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd-MM-yyyy');
}

// Format date for display
export function formatDateDisplay(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

// Get today's date in YYYY-MM-DD format
export function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

// Generate voucher number
export function generateVoucherNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `V-${year}${month}-${random}`;
}

// Calculate running balance
export function calculateRunningBalance(transactions) {
  let balance = 0;
  return transactions.map(t => {
    balance += (t.debit || 0) - (t.credit || 0);
    return { ...t, runningBalance: balance };
  }).reverse();
}

// Group transactions by date
export function groupByDate(transactions) {
  const groups = {};
  transactions.forEach(t => {
    const date = formatDate(t.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
  });
  return groups;
}

// Filter transactions
export function filterTransactions(transactions, filters) {
  return transactions.filter(t => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        t.description?.toLowerCase().includes(search) ||
        t.partyName?.toLowerCase().includes(search) ||
        t.voucherNo?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    if (filters.category && t.category !== filters.category) return false;
    if (filters.partyId && t.partyId !== filters.partyId) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (filters.type === 'credit' && !t.credit) return false;
    if (filters.type === 'debit' && !t.debit) return false;
    
    return true;
  });
}
