import { useState, useEffect } from 'react';
import { Save, Banknote, Camera, Image, Trash2 } from 'lucide-react';
import { getParties, saveTransaction, saveImage } from '../utils/api';
import { getToday, generateVoucherNo, formatCurrency } from '../utils/helpers';
import { compressImage } from '../utils/imageStorage';

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];

function AddPayment({ onSuccess, refreshKey }) {
  const [parties, setParties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    date: getToday(),
    voucherNo: generateVoucherNo(),
    partyId: '',
    partyName: '',
    amount: '',
    paymentMode: 'Cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    const partiesList = await getParties();
    setParties(partiesList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'partyId' && value) {
      const party = parties.find(p => p.id === value);
      if (party) {
        setForm(prev => ({ ...prev, partyName: party.name }));
        setSelectedParty(party);
      }
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
    
    if (!form.amount || !form.partyId) {
      alert('Please select Party and enter Amount');
      return;
    }

    setSaving(true);

    const transaction = {
      date: form.date,
      voucherNo: form.voucherNo,
      partyId: form.partyId,
      partyName: form.partyName,
      description: `Payment to ${form.partyName}`,
      category: 'payment',
      type: 'payment',
      credit: parseFloat(form.amount),
      debit: 0,
      purchaseAmount: 0,
      paymentMode: form.paymentMode,
      reference: form.reference,
      notes: form.notes,
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
      amount: '',
      paymentMode: 'Cash',
      reference: '',
      notes: ''
    });
    setSelectedParty(null);
    setAttachedImage(null);
    setImagePreview(null);

    setSaving(false);
    onSuccess?.();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Banknote className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Payment Entry</h2>
            <p className="text-xs sm:text-sm text-gray-500">Record payment made to a party</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-green-700">
            <strong>Note:</strong> This will reduce the outstanding balance owed to them.
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Pay To (Party) *</label>
            <select
              name="partyId"
              value={form.partyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              required
            >
              <option value="">-- Select Party --</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>
                  {party.name} {party.currentBalance < 0 ? `(Due: ${formatCurrency(Math.abs(party.currentBalance))})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Party Balance Info */}
          {selectedParty && (
            <div className={`p-3 sm:p-4 rounded-lg ${selectedParty.currentBalance < 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Current Balance:</span>
                <span className={`text-base sm:text-lg font-bold ${selectedParty.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(selectedParty.currentBalance)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedParty.currentBalance < 0 
                  ? 'You owe this amount' 
                  : selectedParty.currentBalance > 0 
                    ? 'Party owes you'
                    : 'No outstanding balance'}
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-3 py-3 border-2 border-green-200 rounded-lg text-lg sm:text-xl font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0"
              required
            />
            {selectedParty && selectedParty.currentBalance < 0 && (
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, amount: Math.abs(selectedParty.currentBalance).toString() }))}
                className="text-xs sm:text-sm text-green-600 mt-1 hover:underline"
              >
                Pay full: {formatCurrency(Math.abs(selectedParty.currentBalance))}
              </button>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {PAYMENT_MODES.map(mode => (
                <label
                  key={mode}
                  className={`px-3 py-2 rounded-lg border cursor-pointer transition-all text-center text-sm ${
                    form.paymentMode === mode 
                      ? 'border-green-500 bg-green-50 text-green-700' 
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reference/Receipt No</label>
              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Transaction ID"
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
              📎 Receipt Photo (Optional)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Attached receipt" 
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
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-sm sm:text-base"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddPayment;
