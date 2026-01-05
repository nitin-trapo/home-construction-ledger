import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings, exportData, importData, getTransactions, getParties } from '../utils/api';
import { formatCurrencyFull } from '../utils/helpers';

function SettingsPage({ onSettingsChange, refreshKey }) {
  const [settings, setSettings] = useState({
    projectName: '',
    budget: 0
  });
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ transactions: 0, parties: 0 });

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    const [s, txns, partiesList] = await Promise.all([
      getSettings(),
      getTransactions(),
      getParties()
    ]);
    setSettings(s);
    setStats({
      transactions: txns.length,
      parties: partiesList.length
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    await updateSettings(settings);
    onSettingsChange?.(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rojmel_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (confirm('This will replace all existing data. Are you sure?')) {
          importData(data);
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      if (confirm('This will permanently delete all transactions, parties, and settings. Proceed?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Project Settings */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Project Settings</h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={settings.projectName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="My Home Construction"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Budget (₹)</label>
            <input
              type="number"
              name="budget"
              value={settings.budget}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2500000"
            />
            <p className="text-sm text-gray-500 mt-1">
              Current: {formatCurrencyFull(settings.budget)}
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Data Statistics</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-600">Transactions</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.transactions}</p>
          </div>
          <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="text-xs sm:text-sm text-green-600">Parties</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.parties}</p>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Backup & Restore</h3>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm"
            >
              <Download size={16} />
              Export
            </button>
            
            <label className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-xs sm:text-sm">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs sm:text-sm text-gray-500">
            Export data regularly to prevent loss.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border-2 border-red-200">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <AlertCircle className="text-red-500" size={18} />
          <h3 className="font-semibold text-red-600 text-sm sm:text-base">Danger Zone</h3>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Delete all data permanently. This cannot be undone.
        </p>

        <button
          onClick={handleClearData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm"
        >
          <Trash2 size={16} />
          Delete All Data
        </button>
      </div>

      {/* About */}
      <div className="bg-gray-100 rounded-xl p-4 sm:p-6 text-center">
        <h3 className="font-bold text-gray-700 text-sm sm:text-base">Home Construction Ledger</h3>
        <p className="text-xs sm:text-sm text-gray-500">Rojmel - Digital Account Book</p>
        <p className="text-xs text-gray-400 mt-1 sm:mt-2">Version 1.0.0</p>
      </div>
    </div>
  );
}

export default SettingsPage;
