import { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { getTransactions, getCategories, getParties, deleteTransaction } from '../utils/storage';
import { formatCurrency, formatDateDisplay, filterTransactions } from '../utils/helpers';

function Transactions({ onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTxns, setFilteredTxns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    partyId: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = filterTransactions(transactions, filters);
    setFilteredTxns(filtered);
  }, [transactions, filters]);

  const loadData = () => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setParties(getParties());
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
      loadData();
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Voucher', 'Party', 'Description', 'Category', 'Debit', 'Credit', 'Payment Mode'],
      ...filteredTxns.map(t => [
        t.date,
        t.voucherNo,
        t.partyName,
        t.description,
        t.category,
        t.debit || '',
        t.credit || '',
        t.paymentMode
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totals = filteredTxns.reduce((acc, t) => ({
    debit: acc.debit + (t.debit || 0),
    credit: acc.credit + (t.credit || 0)
  }), { debit: 0, credit: 0 });

  const getCategoryIcon = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.icon || '📋';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Transactions</h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Party</label>
            <select
              value={filters.partyId}
              onChange={(e) => setFilters({ ...filters, partyId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Parties</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="credit">Expenses (Paid)</option>
              <option value="debit">Income (Received)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-2 py-2 border rounded-lg text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-2 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-50 p-2 sm:p-3 rounded-lg text-center">
          <p className="text-xs sm:text-sm text-blue-600">Entries</p>
          <p className="text-base sm:text-xl font-bold text-blue-700">{filteredTxns.length}</p>
        </div>
        <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-center">
          <p className="text-xs sm:text-sm text-green-600">Received</p>
          <p className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(totals.debit)}</p>
        </div>
        <div className="bg-red-50 p-2 sm:p-3 rounded-lg text-center">
          <p className="text-xs sm:text-sm text-red-600">Paid</p>
          <p className="text-base sm:text-xl font-bold text-red-700">{formatCurrency(totals.credit)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filteredTxns.length > 0 ? (
          <div className="divide-y">
            {filteredTxns.map(txn => (
              <div key={txn.id} className="hover:bg-gray-50 active:bg-gray-100">
                <div 
                  className="p-3 sm:p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === txn.id ? null : txn.id)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="text-lg sm:text-2xl flex-shrink-0">{getCategoryIcon(txn.category)}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{txn.partyName || 'Cash'}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{txn.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="text-right">
                      {txn.credit > 0 && (
                        <p className="font-bold text-red-500 text-sm sm:text-base">-{formatCurrency(txn.credit)}</p>
                      )}
                      {txn.debit > 0 && (
                        <p className="font-bold text-green-500 text-sm sm:text-base">+{formatCurrency(txn.debit)}</p>
                      )}
                      {txn.purchaseAmount > 0 && (
                        <p className="font-bold text-orange-500 text-sm sm:text-base">{formatCurrency(txn.purchaseAmount)}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatDateDisplay(txn.date)}</p>
                    </div>
                    {expandedId === txn.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === txn.id && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 py-2 sm:py-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500">Voucher:</span>
                        <p className="font-medium">{txn.voucherNo}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p className="font-medium truncate">{txn.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment:</span>
                        <p className="font-medium">{txn.paymentMode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Reference:</span>
                        <p className="font-medium truncate">{txn.reference || '-'}</p>
                      </div>
                    </div>
                    {txn.notes && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                        <span className="text-gray-500">Notes:</span> {txn.notes}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(txn.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-xs sm:text-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-sm">No transactions found</p>
            <button 
              onClick={() => onNavigate('add')}
              className="text-blue-600 mt-2 hover:underline text-sm"
            >
              Add your first entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
