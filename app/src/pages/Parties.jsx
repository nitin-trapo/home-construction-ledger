import { useState, useEffect } from 'react';
import { UserPlus, Phone, Trash2, ChevronRight, X, FileText, Edit2 } from 'lucide-react';
import { getParties, getTransactions, saveParty, deleteParty, updateParty, updatePartyBalance } from '../utils/storage';
import { formatCurrency, formatDateDisplay } from '../utils/helpers';

function Parties({ onNavigate }) {
  const [parties, setParties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [filter, setFilter] = useState('all');

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
  }, []);

  const loadData = () => {
    setParties(getParties());
    setTransactions(getTransactions());
  };

  const handleAddParty = () => {
    if (!newParty.name.trim()) {
      alert('Party name is required');
      return;
    }
    saveParty(newParty);
    setNewParty({ name: '', type: 'supplier', phone: '', address: '', openingBalance: 0 });
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteParty = (id) => {
    const hasTransactions = transactions.some(t => t.partyId === id);
    if (hasTransactions) {
      alert('Cannot delete party with existing transactions');
      return;
    }
    if (confirm('Are you sure you want to delete this party?')) {
      deleteParty(id);
      loadData();
    }
  };

  const getPartyTransactions = (partyId) => {
    return transactions.filter(t => t.partyId === partyId);
  };

  const handleSaveOpeningBalance = () => {
    if (selectedParty) {
      updateParty(selectedParty.id, { openingBalance: tempOpeningBalance });
      updatePartyBalance(selectedParty.id);
      loadData();
      // Update selected party with new data
      const updatedParties = getParties();
      const updated = updatedParties.find(p => p.id === selectedParty.id);
      setSelectedParty(updated);
      setEditingOpeningBalance(false);
    }
  };

  const filteredParties = parties.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'owing') return p.currentBalance < 0;
    if (filter === 'owed') return p.currentBalance > 0;
    return p.type === filter;
  });

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
            onClick={() => setFilter(f.id)}
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

      {/* Parties List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filteredParties.length > 0 ? (
          <div className="divide-y">
            {filteredParties.map(party => (
              <div 
                key={party.id}
                className="p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex items-center justify-between"
                onClick={() => setSelectedParty(party)}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm sm:text-lg font-bold text-gray-600 flex-shrink-0">
                    {party.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{party.name}</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${getTypeColor(party.type)}`}>
                        {party.type}
                      </span>
                      {party.phone && (
                        <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                          <Phone size={12} /> {party.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={`font-bold text-sm sm:text-base ${party.currentBalance < 0 ? 'text-red-500' : party.currentBalance > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                      {formatCurrency(party.currentBalance)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {party.currentBalance < 0 ? 'We owe' : party.currentBalance > 0 ? 'They owe' : 'Settled'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
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
