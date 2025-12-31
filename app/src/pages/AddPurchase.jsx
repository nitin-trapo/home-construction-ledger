import { useState, useEffect } from 'react';
import { Save, UserPlus, X, ShoppingCart, Camera, Image, Trash2 } from 'lucide-react';
import { getCategories, getParties, saveTransaction, saveParty, saveImage } from '../utils/api';
import { getToday, generateVoucherNo } from '../utils/helpers';
import { compressImage } from '../utils/imageStorage';

function AddPurchase({ onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [showNewParty, setShowNewParty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    date: getToday(),
    voucherNo: generateVoucherNo(),
    partyId: '',
    partyName: '',
    description: '',
    category: 'materials',
    subCategory: '',
    amount: '',
    invoiceNo: '',
    notes: ''
  });

  const [newParty, setNewParty] = useState({
    name: '',
    type: 'supplier',
    phone: '',
    openingBalance: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cats, partiesList] = await Promise.all([
      getCategories(),
      getParties()
    ]);
    setCategories(cats);
    setParties(partiesList);
  };

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

  const handleSaveNewParty = async () => {
    if (!newParty.name) {
      alert('Please enter party name');
      return;
    }
    try {
      const party = await saveParty(newParty);
      if (party && party.id) {
        setParties([...parties, party]);
        setForm(prev => ({ 
          ...prev, 
          partyId: party.id, 
          partyName: party.name 
        }));
        setNewParty({ name: '', type: 'supplier', phone: '', openingBalance: 0 });
        setShowNewParty(false);
      } else {
        alert('Failed to save party. Please check if server is running.');
      }
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Error saving party: ' + error.message);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const compressed = await compressImage(file, 1200, 0.7);
      setAttachedImage(compressed);
      setImagePreview(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error processing image');
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.amount || !form.description || !form.partyId) {
      alert('Please fill Party, Amount and Description');
      return;
    }

    setSaving(true);

    const transaction = {
      date: form.date,
      voucherNo: form.voucherNo,
      partyId: form.partyId,
      partyName: form.partyName,
      description: form.description,
      category: form.category,
      subCategory: form.subCategory,
      type: 'purchase',
      purchaseAmount: parseFloat(form.amount),
      credit: 0,
      debit: 0,
      paymentMode: 'Credit',
      reference: form.invoiceNo,
      notes: form.notes,
      isPaid: false,
      hasAttachment: !!attachedImage
    };

    const savedTxn = await saveTransaction(transaction);
    
    // Save image if attached
    if (attachedImage && savedTxn?.id) {
      try {
        await saveImage(savedTxn.id, attachedImage);
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
    
    setForm({
      date: getToday(),
      voucherNo: generateVoucherNo(),
      partyId: '',
      partyName: '',
      description: '',
      category: 'materials',
      subCategory: '',
      amount: '',
      invoiceNo: '',
      notes: ''
    });
    setAttachedImage(null);
    setImagePreview(null);

    setSaving(false);
    onSuccess?.();
  };

  const selectedCategory = categories.find(c => c.id === form.category);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ShoppingCart className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Purchase Entry</h2>
            <p className="text-xs sm:text-sm text-gray-500">Record purchase on credit</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-orange-700">
            <strong>Note:</strong> This records goods received on credit. Use "Payment Entry" when you pay.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Date and Voucher */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Voucher No</label>
              <input
                type="text"
                name="voucherNo"
                value={form.voucherNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                readOnly
              />
            </div>
          </div>

          {/* Party Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Party (Supplier) *</label>
              <button
                type="button"
                onClick={() => setShowNewParty(true)}
                className="text-orange-600 text-sm flex items-center gap-1 hover:underline"
              >
                <UserPlus size={14} /> Add New
              </button>
            </div>
            <select
              name="partyId"
              value={form.partyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              required
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
                      placeholder="e.g., Ramesh Steel Supplier"
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
                  <button
                    type="button"
                    onClick={handleSaveNewParty}
                    className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                  >
                    Add Party
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
              >
                {categories.filter(c => c.id !== 'income').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
              <select
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Purchase Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-3 py-3 border-2 border-orange-200 rounded-lg text-lg sm:text-xl font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="e.g., 2 Ton TMT Steel Bars"
              required
            />
          </div>

          {/* Invoice No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Invoice/Bill No</label>
              <input
                type="text"
                name="invoiceNo"
                value={form.invoiceNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="INV-12345"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Photo Attachment */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              📎 Bill/Receipt Photo (Optional)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Attached bill" 
                  className="w-full max-h-48 object-contain rounded-lg bg-gray-100"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                  <Camera size={18} />
                  <span>Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                  <Image size={18} />
                  <span>Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-sm sm:text-base"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Purchase Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddPurchase;
