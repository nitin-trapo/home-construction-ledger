import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Phone, Trash2, ChevronRight, X, FileText, Edit2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, Search } from 'lucide-react';
import { getParties, getTransactions, saveParty, deleteParty, updateParty, updatePartyBalance } from '../utils/api';
import { formatCurrency, formatDateDisplay } from '../utils/helpers';

function Parties({ onNavigate, refreshKey }) {
  const [parties, setParties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // DataTable state
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newParty, setNewParty] = useState({
    name: '',
    type: 'supplier',
    phone: '',
    address: '',
    openingBalance: 0
  });
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [tempOpeningBalance, setTempOpeningBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    const [partiesList, txns] = await Promise.all([
      getParties(),
      getTransactions()
    ]);
    setParties(partiesList);
    setTransactions(txns);
  };

  const handleAddParty = async () => {
    if (!newParty.name.trim()) {
      alert('Party name is required');
      return;
    }
    await saveParty(newParty);
    setNewParty({ name: '', type: 'supplier', phone: '', address: '', openingBalance: 0 });
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteParty = async (id) => {
    const hasTransactions = transactions.some(t => t.partyId === id);
    if (hasTransactions) {
      alert('Cannot delete party with existing transactions');
      return;
    }
    if (confirm('Delete this party?')) {
      await deleteParty(id);
      loadData();
    }
  };

  const getPartyTransactions = (partyId) => {
    return transactions.filter(t => t.partyId === partyId);
  };

  const handleSaveOpeningBalance = async () => {
    if (selectedParty) {
      await updateParty(selectedParty.id, { openingBalance: tempOpeningBalance });
      await updatePartyBalance(selectedParty.id);
      await loadData();
      // Update selected party with new data
      const updatedParties = await getParties();
      const updated = updatedParties.find(p => p.id === selectedParty.id);
      setSelectedParty(updated);
      setEditingOpeningBalance(false);
    }
  };

  const filteredParties = useMemo(() => {
    let filtered = parties.filter(p => {
      if (filter === 'all') return true;
      if (filter === 'owing') return p.currentBalance < 0;
      if (filter === 'owed') return p.currentBalance > 0;
      return p.type === filter;
    });
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.phone?.toLowerCase().includes(search) ||
        p.type?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [parties, filter, searchTerm]);

  // Sorting logic
  const sortedParties = useMemo(() => {
    const sorted = [...filteredParties];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'type':
          aVal = (a.type || '').toLowerCase();
          bVal = (b.type || '').toLowerCase();
          break;
        case 'balance':
          aVal = a.currentBalance || 0;
          bVal = b.currentBalance || 0;
          break;
        case 'phone':
          aVal = a.phone || '';
          bVal = b.phone || '';
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredParties, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedParties.length / pageSize);
  const paginatedParties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedParties.slice(start, start + pageSize);
  }, [sortedParties, currentPage, pageSize]);

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

  const getTypeColor = (type) => {
    const colors = {
      supplier: 'bg-blue-100 text-blue-700',
      contractor: 'bg-purple-100 text-purple-700',
      labor: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Parties (Khata)</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <UserPlus size={16} />
          <span className="hidden xs:inline">Add</span> Party
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search parties..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'owing', label: 'We Owe' },
          { id: 'owed', label: 'They Owe' },
          { id: 'supplier', label: 'Suppliers' },
          { id: 'contractor', label: 'Contractors' },
          { id: 'labor', label: 'Labor' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setCurrentPage(1); }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${
              filter === f.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-red-50 p-3 sm:p-4 rounded-xl">
          <p className="text-xs sm:text-sm text-red-600">We Owe</p>
          <p className="text-lg sm:text-2xl font-bold text-red-700">
            {formatCurrency(Math.abs(parties.filter(p => p.currentBalance < 0).reduce((sum, p) => sum + p.currentBalance, 0)))}
          </p>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-xl">
          <p className="text-xs sm:text-sm text-green-600">They Owe</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700">
            {formatCurrency(parties.filter(p => p.currentBalance > 0).reduce((sum, p) => sum + p.currentBalance, 0))}
          </p>
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
          Showing {sortedParties.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedParties.length)} of {sortedParties.length} entries
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {sortedParties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Party Name <SortIcon columnKey="name" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('type')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Type <SortIcon columnKey="type" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('phone')}
                    className="px-3 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">Phone <SortIcon columnKey="phone" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('balance')}
                    className="px-3 py-3 text-right font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1">Balance <SortIcon columnKey="balance" /></div>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedParties.map(party => (
                  <tr key={party.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                          {party.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{party.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(party.type)}`}>
                        {party.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-gray-600">
                      {party.phone || '-'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className={`font-semibold ${party.currentBalance < 0 ? 'text-red-600' : party.currentBalance > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {formatCurrency(Math.abs(party.currentBalance))}
                      </p>
                      <p className="text-xs text-gray-400">
                        {party.currentBalance < 0 ? 'We owe' : party.currentBalance > 0 ? 'They owe' : 'Settled'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedParty(party)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => onNavigate('partyLedger', { partyId: party.id })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="View Ledger"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteParty(party.id)}
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
            </table>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-sm">No parties found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 mt-2 hover:underline text-sm"
            >
              Add your first party
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

      {/* Add Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add New Party</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
                <input
                  type="text"
                  value={newParty.name}
                  onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Ramesh Cement Supplier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newParty.type}
                  onChange={(e) => setNewParty({ ...newParty, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="supplier">Supplier</option>
                  <option value="contractor">Contractor</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newParty.phone}
                  onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newParty.address}
                  onChange={(e) => setNewParty({ ...newParty, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={newParty.openingBalance}
                  onChange={(e) => setNewParty({ ...newParty, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Positive = they owe us, Negative = we owe them</p>
              </div>
              <button
                onClick={handleAddParty}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Party Details Modal */}
      {selectedParty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedParty.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(selectedParty.type)}`}>
                  {selectedParty.type}
                </span>
              </div>
              <button onClick={() => { setSelectedParty(null); setEditingOpeningBalance(false); }} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-sm">{selectedParty.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Balance</p>
                  <p className={`font-bold text-base ${selectedParty.currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(selectedParty.currentBalance)}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Opening Balance</p>
                    {!editingOpeningBalance && (
                      <button
                        onClick={() => {
                          setTempOpeningBalance(selectedParty.openingBalance || 0);
                          setEditingOpeningBalance(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </div>
                  {editingOpeningBalance ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="number"
                        value={tempOpeningBalance}
                        onChange={(e) => setTempOpeningBalance(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Enter opening balance"
                      />
                      <button
                        onClick={handleSaveOpeningBalance}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingOpeningBalance(false)}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className={`font-bold text-base ${(selectedParty.openingBalance || 0) < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {formatCurrency(selectedParty.openingBalance || 0)}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        {(selectedParty.openingBalance || 0) < 0 ? '(we owe)' : (selectedParty.openingBalance || 0) > 0 ? '(they owe)' : ''}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Transaction History</h4>
              {getPartyTransactions(selectedParty.id).length > 0 ? (
                <div className="space-y-2">
                  {getPartyTransactions(selectedParty.id).map(txn => (
                    <div key={txn.id} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                      <div>
                        <p className="font-medium text-sm">{txn.description}</p>
                        <p className="text-xs text-gray-500">{formatDateDisplay(txn.date)}</p>
                      </div>
                      <div className="text-right">
                        {txn.purchaseAmount > 0 && <p className="text-orange-500 font-medium">Purchase: {formatCurrency(txn.purchaseAmount)}</p>}
                        {txn.credit > 0 && <p className="text-green-500 font-medium">Paid: {formatCurrency(txn.credit)}</p>}
                        {txn.debit > 0 && <p className="text-blue-500 font-medium">Received: {formatCurrency(txn.debit)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No transactions yet</p>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <button
                onClick={() => {
                  handleDeleteParty(selectedParty.id);
                  setSelectedParty(null);
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} /> Delete Party
              </button>
              <button
                onClick={() => {
                  setSelectedParty(null);
                  onNavigate('partyLedger', { partyId: selectedParty.id });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText size={16} /> View Full Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Parties;
