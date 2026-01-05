import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Trash2, Edit2, ChevronDown, ChevronUp, X, Save, Paperclip, Image, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTransactions, getCategories, getParties, deleteTransaction, updateTransaction, updatePartyBalance, getImage, deleteImage } from '../utils/api';
import { formatCurrency, formatDateDisplay, filterTransactions, safeDate } from '../utils/helpers';

function Transactions({ onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTxns, setFilteredTxns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingImage, setViewingImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // DataTable state
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, filters]);

  // Sorting logic
  const sortedTxns = useMemo(() => {
    const sorted = [...filteredTxns];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'date':
          aVal = safeDate(a.date);
          bVal = safeDate(b.date);
          break;
        case 'party':
          aVal = (a.partyName || '').toLowerCase();
          bVal = (b.partyName || '').toLowerCase();
          break;
        case 'amount':
          aVal = a.credit || a.debit || a.purchaseAmount || 0;
          bVal = b.credit || b.debit || b.purchaseAmount || 0;
          break;
        case 'category':
          aVal = (a.category || '').toLowerCase();
          bVal = (b.category || '').toLowerCase();
          break;
        case 'voucher':
          aVal = a.voucherNo || '';
          bVal = b.voucherNo || '';
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTxns, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTxns.length / pageSize);
  const paginatedTxns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTxns.slice(start, start + pageSize);
  }, [sortedTxns, currentPage, pageSize]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />;
  };

  const loadData = async () => {
    const [txns, cats, partiesList] = await Promise.all([
      getTransactions(),
      getCategories(),
      getParties()
    ]);
    setTransactions(txns);
    setCategories(cats);
    setParties(partiesList);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      // Delete associated image if exists
      try {
        await deleteImage(id);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
      deleteTransaction(id);
      loadData();
    }
  };

  const handleViewImage = async (txnId) => {
    setLoadingImage(true);
    try {
      const imageData = await getImage(txnId);
      if (imageData) {
        setViewingImage(imageData);
      } else {
        alert('Image not found');
      }
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Error loading image');
    }
    setLoadingImage(false);
  };

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    // Find matching category (handle case where category might be stored as name)
    let categoryId = txn.category || '';
    const matchedCat = categories.find(c => c.id === txn.category || c.name === txn.category);
    if (matchedCat) {
      categoryId = matchedCat.id;
    }
    
    setEditForm({
      date: txn.date || '',
      description: txn.description || '',
      category: categoryId,
      subCategory: txn.subCategory || '',
      amount: txn.credit || txn.debit || txn.purchaseAmount || '',
      paymentMode: txn.paymentMode || 'Cash',
      reference: txn.reference || '',
      notes: txn.notes || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      // Reset subCategory when category changes
      if (name === 'category') {
        return { ...prev, [name]: value, subCategory: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.description || !editForm.amount) {
      alert('Please fill description and amount');
      return;
    }

    const updates = {
      date: editForm.date,
      description: editForm.description,
      category: editForm.category,
      subCategory: editForm.subCategory,
      paymentMode: editForm.paymentMode,
      reference: editForm.reference,
      notes: editForm.notes
    };

    // Update amount based on transaction type
    const amount = parseFloat(editForm.amount);
    if (editingTxn.type === 'purchase') {
      updates.purchaseAmount = amount;
    } else if (editingTxn.type === 'payment') {
      updates.credit = amount;
    } else if (editingTxn.debit > 0) {
      updates.debit = amount;
    } else {
      updates.credit = amount;
    }

    updateTransaction(editingTxn.id, updates);
    
    // Update party balance if there's a party
    if (editingTxn.partyId) {
      updatePartyBalance(editingTxn.partyId);
    }

    setEditingTxn(null);
    loadData();
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

      {/* DataTable Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 shadow">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
        <div className="text-sm text-gray-600">
          Showing {sortedTxns.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedTxns.length)} of {sortedTxns.length} entries
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {sortedTxns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Date <SortIcon columnKey="date" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('voucher')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Voucher <SortIcon columnKey="voucher" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('party')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Party <SortIcon columnKey="party" /></div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Description</th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Category <SortIcon columnKey="category" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="px-3 py-3 text-right font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1">Amount <SortIcon columnKey="amount" /></div>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedTxns.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                      {formatDateDisplay(txn.date)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{txn.voucherNo}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(txn.category)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[120px] sm:max-w-[180px]">{txn.partyName || 'Cash'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px] md:hidden">{txn.description}</p>
                        </div>
                        {txn.hasAttachment && <Paperclip size={12} className="text-purple-500 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <p className="text-gray-600 truncate max-w-[200px]">{txn.description}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
                        {txn.category || 'misc'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {txn.purchaseAmount > 0 && (
                        <span className="font-semibold text-orange-600">{formatCurrency(txn.purchaseAmount)}</span>
                      )}
                      {txn.credit > 0 && (
                        <span className="font-semibold text-red-600">-{formatCurrency(txn.credit)}</span>
                      )}
                      {txn.debit > 0 && (
                        <span className="font-semibold text-green-600">+{formatCurrency(txn.debit)}</span>
                      )}
                      <p className="text-xs text-gray-400">{txn.paymentMode}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {txn.hasAttachment && (
                          <button
                            onClick={() => handleViewImage(txn.id)}
                            disabled={loadingImage}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="View Photo"
                          >
                            <Image size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(txn)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td colSpan="5" className="px-3 py-3 text-right text-gray-600">Total:</td>
                  <td className="px-3 py-3 text-right">
                    <p className="text-green-600">+{formatCurrency(totals.debit)}</p>
                    <p className="text-red-600">-{formatCurrency(totals.credit)}</p>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 shadow">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Edit Transaction</h3>
              <button onClick={() => setEditingTxn(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Transaction Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{editingTxn.partyName}</span> • {editingTxn.voucherNo}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Type: {editingTxn.type === 'purchase' ? '🛒 Purchase' : editingTxn.type === 'payment' ? '💵 Payment' : editingTxn.debit > 0 ? '💰 Income' : '💸 Expense'}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                  <select
                    name="subCategory"
                    value={editForm.subCategory}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select --</option>
                    {(categories.find(c => c.id === editForm.category)?.subcategories || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={editForm.paymentMode}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* Reference & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    name="reference"
                    value={editForm.reference}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Bill/Receipt No"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Notes"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setEditingTxn(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button 
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img 
              src={viewingImage} 
              alt="Bill/Receipt" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-center text-white text-sm mt-2">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
