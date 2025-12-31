import { useState, useEffect } from 'react';
import { Save, UserPlus, X } from 'lucide-react';
import { getCategories, getParties, saveTransaction, saveParty } from '../utils/storage';
import { getToday, generateVoucherNo } from '../utils/helpers';

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit'];

function AddTransaction({ onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [showNewParty, setShowNewParty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: getToday(),
    voucherNo: generateVoucherNo(),
    partyId: '',
    partyName: '',
    description: '',
    category: '',
    subCategory: '',
    transactionType: 'expense',
    amount: '',
    paymentMode: 'Cash',
    reference: '',
    notes: ''
  });

  const [newParty, setNewParty] = useState({
    name: '',
    type: 'supplier',
    phone: '',
    openingBalance: 0
  });

  useEffect(() => {
    setCategories(getCategories());
    setParties(getParties());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'partyId' && value) {
      const party = parties.find(p => p.id === value);
      if (party) {
        setForm(prev => ({ ...prev, partyName: party.name }));
      }
    }
  };

  const handleAddParty = () => {
    if (!newParty.name.trim()) return;

    const party = saveParty(newParty);
    setParties([...parties, party]);
    setForm(prev => ({ 
      ...prev, 
      partyId: party.id, 
      partyName: party.name 
    }));
    setNewParty({ name: '', type: 'supplier', phone: '', openingBalance: 0 });
    setShowNewParty(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.amount || !form.description) {
      alert('Please fill amount and description');
      return;
    }

    setSaving(true);

    const transaction = {
      date: form.date,
      voucherNo: form.voucherNo,
      partyId: form.partyId,
      partyName: form.partyName || 'Cash',
      description: form.description,
      category: form.category,
      subCategory: form.subCategory,
      credit: form.transactionType === 'expense' ? parseFloat(form.amount) : 0,
      debit: form.transactionType === 'income' ? parseFloat(form.amount) : 0,
      paymentMode: form.paymentMode,
      reference: form.reference,
      notes: form.notes
    };

    saveTransaction(transaction);
    
    // Reset form
    setForm({
      date: getToday(),
      voucherNo: generateVoucherNo(),
      partyId: '',
      partyName: '',
      description: '',
      category: '',
      subCategory: '',
      transactionType: 'expense',
      amount: '',
      paymentMode: 'Cash',
      reference: '',
      notes: ''
    });

    setSaving(false);
    onSuccess?.();
  };

  const selectedCategory = categories.find(c => c.id === form.category);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Entry</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date and Voucher */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voucher No</label>
              <input
                type="text"
                name="voucherNo"
                value={form.voucherNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <div className="flex gap-4">
              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                form.transactionType === 'expense' 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="transactionType"
                  value="expense"
                  checked={form.transactionType === 'expense'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="font-medium">💸 Expense (Payment)</span>
              </label>
              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                form.transactionType === 'income' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="transactionType"
                  value="income"
                  checked={form.transactionType === 'income'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="font-medium">💰 Income (Receipt)</span>
              </label>
            </div>
          </div>

          {/* Party Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Party (Khata)</label>
              <button
                type="button"
                onClick={() => setShowNewParty(true)}
                className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
              >
                <UserPlus size={14} /> Add New
              </button>
            </div>
            <select
              name="partyId"
              value={form.partyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Party --</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>{party.name}</option>
              ))}
            </select>
          </div>

          {/* New Party Modal */}
          {showNewParty && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Add New Party</h3>
                  <button onClick={() => setShowNewParty(false)} className="text-gray-500 hover:text-gray-700">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                    <input
                      type="number"
                      value={newParty.openingBalance}
                      onChange={(e) => setNewParty({ ...newParty, openingBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Positive if they owe you, negative if you owe them</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParty}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Party
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
              <select
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedCategory}
              >
                <option value="">-- Select --</option>
                {selectedCategory?.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-3 py-3 border-2 rounded-lg text-xl font-bold focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 50 bags cement @ ₹350"
              required
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map(mode => (
                <label
                  key={mode}
                  className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                    form.paymentMode === mode 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value={mode}
                    checked={form.paymentMode === mode}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {mode}
                </label>
              ))}
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference/Bill No</label>
              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Bill/Receipt No"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddTransaction;
