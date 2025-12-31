import { useState, useEffect } from 'react';
import { Home, Plus, List, Users, BarChart3, Settings, Menu, X, ShoppingCart, Banknote } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import AddPurchase from './pages/AddPurchase';
import AddPayment from './pages/AddPayment';
import Parties from './pages/Parties';
import PartyLedger from './pages/PartyLedger';
import CompanyLedger from './pages/CompanyLedger';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import { initializeData, getSettings } from './utils/storage';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'add', label: 'Entries', icon: Plus },
  { id: 'transactions', label: 'Transactions', icon: List },
  { id: 'parties', label: 'Parties', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({ projectName: 'Home Construction Ledger' });
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  useEffect(() => {
    initializeData();
    setSettings(getSettings());
  }, []);

  const handleNavigate = (page, data = null) => {
    if (page === 'partyLedger' && data?.partyId) {
      setSelectedPartyId(data.partyId);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'add':
        return <EntrySelector onNavigate={handleNavigate} />;
      case 'purchase':
        return <AddPurchase onSuccess={() => handleNavigate('transactions')} />;
      case 'payment':
        return <AddPayment onSuccess={() => handleNavigate('transactions')} />;
      case 'income':
        return <AddTransaction onSuccess={() => handleNavigate('transactions')} />;
      case 'transactions':
        return <Transactions onNavigate={handleNavigate} />;
      case 'parties':
        return <Parties onNavigate={handleNavigate} />;
      case 'partyLedger':
        return <PartyLedger partyId={selectedPartyId} onBack={() => handleNavigate('parties')} />;
      case 'companyLedger':
        return <CompanyLedger onBack={() => handleNavigate('reports')} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onSettingsChange={setSettings} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h1 className="text-lg font-bold">{settings.projectName}</h1>
              <p className="text-xs text-blue-100">Construction Rojmel</p>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-blue-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === item.id || (item.id === 'add' && ['purchase', 'payment', 'income'].includes(currentPage))
                    ? 'bg-white text-blue-600' 
                    : 'hover:bg-blue-500 text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-blue-700 border-t border-blue-500 px-4 py-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${
                  currentPage === item.id || (item.id === 'add' && ['purchase', 'payment', 'income'].includes(currentPage))
                    ? 'bg-white text-blue-600' 
                    : 'hover:bg-blue-500 text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center p-2 rounded-lg ${
                currentPage === item.id || (item.id === 'add' && ['purchase', 'payment', 'income'].includes(currentPage))
                  ? 'text-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}

// Entry Selector Component
function EntrySelector({ onNavigate }) {
  const entries = [
    {
      id: 'purchase',
      title: 'Purchase Entry',
      description: 'Record credit purchase',
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      id: 'payment',
      title: 'Payment Entry',
      description: 'Record payment to party',
      icon: Banknote,
      color: 'green'
    },
    {
      id: 'income',
      title: 'Receipt / Income',
      description: 'Record funds received',
      icon: Plus,
      color: 'blue'
    }
  ];

  const colorClasses = {
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 active:bg-orange-200',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 active:bg-green-200',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 active:bg-blue-200'
  };

  const iconColorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Select Entry Type</h2>
      <div className="space-y-3 sm:space-y-4">
        {entries.map(entry => (
          <button
            key={entry.id}
            onClick={() => onNavigate(entry.id)}
            className={`w-full p-4 sm:p-5 rounded-xl border-2 flex items-center gap-3 sm:gap-4 transition-all ${colorClasses[entry.color]}`}
          >
            <div className={`p-2 sm:p-3 rounded-lg ${iconColorClasses[entry.color]}`}>
              <entry.icon size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800 text-base sm:text-lg">{entry.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{entry.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
