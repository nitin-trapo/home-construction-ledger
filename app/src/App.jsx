import { useState, useEffect } from 'react';
import { Home, Plus, List, Users, BarChart3, Settings, Menu, X, ShoppingCart, Banknote, FolderOpen, ChevronDown, PlusCircle, LogOut, Shield } from 'lucide-react';
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
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import { initializeData, getSettings, getProjects, getActiveProject, setActiveProject, createProject, isAuthenticated, getCurrentUser, logout } from './utils/api';

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
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProjectState] = useState(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('2500000');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if already logged in
    if (isAuthenticated()) {
      setUser(getCurrentUser());
      setIsLoggedIn(true);
      initApp();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeProject) {
      loadSettings();
    }
  }, [activeProject, refreshKey]);

  const initApp = async () => {
    try {
      setLoading(true);
      setError(null);
      await initializeData();
      await loadProjectData();
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError('Cannot connect to server. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    const projectsList = await getProjects();
    setProjects(projectsList);
    setActiveProjectState(getActiveProject());
    await loadSettings();
  };

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    initApp();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsLoggedIn(false);
    setProjects([]);
    setActiveProjectState(null);
    setCurrentPage('dashboard');
  };

  const handleSwitchProject = (project) => {
    setActiveProject(project);
    setActiveProjectState(project);
    setShowProjectMenu(false);
    setRefreshKey(prev => prev + 1);
    setCurrentPage('dashboard');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    const project = await createProject(newProjectName.trim(), parseFloat(newProjectBudget) || 2500000);
    setActiveProject(project);
    setActiveProjectState(project);
    const projectsList = await getProjects();
    setProjects(projectsList);
    setNewProjectName('');
    setNewProjectBudget('2500000');
    setShowNewProject(false);
    setShowProjectMenu(false);
    setRefreshKey(prev => prev + 1);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page, data = null) => {
    if (page === 'partyLedger' && data?.partyId) {
      setSelectedPartyId(data.partyId);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />;
      case 'add':
        return <EntrySelector onNavigate={handleNavigate} />;
      case 'purchase':
        return <AddPurchase onSuccess={() => handleNavigate('transactions')} refreshKey={refreshKey} />;
      case 'payment':
        return <AddPayment onSuccess={() => handleNavigate('transactions')} refreshKey={refreshKey} />;
      case 'income':
        return <AddTransaction onSuccess={() => handleNavigate('transactions')} refreshKey={refreshKey} />;
      case 'transactions':
        return <Transactions onNavigate={handleNavigate} refreshKey={refreshKey} />;
      case 'parties':
        return <Parties onNavigate={handleNavigate} refreshKey={refreshKey} />;
      case 'partyLedger':
        return <PartyLedger partyId={selectedPartyId} onBack={() => handleNavigate('parties')} refreshKey={refreshKey} />;
      case 'companyLedger':
        return <CompanyLedger onBack={() => handleNavigate('reports')} refreshKey={refreshKey} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} refreshKey={refreshKey} />;
      case 'settings':
        return <SettingsPage onSettingsChange={setSettings} refreshKey={refreshKey} />;
      case 'admin':
        return <AdminPanel onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />;
    }
  };

  // Show login if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏠</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 rounded-xl shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-gray-100 p-3 rounded-lg text-left text-sm mb-4">
            <p className="font-mono">cd server</p>
            <p className="font-mono">npm run dev</p>
          </div>
          <button 
            onClick={initApp}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 relative">
            <span className="text-2xl">🏠</span>
            <button 
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-1 hover:bg-blue-500 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="text-left">
                <h1 className="text-lg font-bold">{settings.projectName}</h1>
                <p className="text-xs text-blue-100">Construction Rojmel</p>
              </div>
              <ChevronDown size={16} className={`transition-transform ${showProjectMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Project Dropdown */}
            {showProjectMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border w-64 z-50 overflow-hidden">
                <div className="p-2 border-b bg-gray-50">
                  <p className="text-xs text-gray-500 font-medium px-2">SWITCH PROJECT</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {projects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => handleSwitchProject(proj)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${activeProject?.id === proj.id ? 'bg-blue-50' : ''}`}
                    >
                      <FolderOpen size={18} className={activeProject?.id === proj.id ? 'text-blue-600' : 'text-gray-400'} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${activeProject?.id === proj.id ? 'text-blue-600' : 'text-gray-800'}`}>{proj.name}</p>
                        <p className="text-xs text-gray-400">₹{(proj.budget / 100000).toFixed(1)}L budget</p>
                      </div>
                      {activeProject?.id === proj.id && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Active</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t p-2">
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <PlusCircle size={18} />
                    <span className="font-medium">New Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-blue-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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
            {/* Admin Panel (superadmin only) */}
            {user?.role === 'superadmin' && (
              <button
                onClick={() => handleNavigate('admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin' ? 'bg-white text-blue-600' : 'hover:bg-blue-500 text-white'
                }`}
              >
                <Shield size={18} />
                <span className="text-sm font-medium">Admin</span>
              </button>
            )}
            {/* User info & Logout */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-blue-400">
              <span className="text-sm text-blue-100">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-blue-500 rounded-lg"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
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
            {/* Admin Panel (superadmin only) */}
            {user?.role === 'superadmin' && (
              <button
                onClick={() => { handleNavigate('admin'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${
                  currentPage === 'admin' ? 'bg-white text-blue-600' : 'hover:bg-blue-500 text-white'
                }`}
              >
                <Shield size={20} />
                <span className="font-medium">Admin Panel</span>
              </button>
            )}
            {/* User info & Logout */}
            <div className="border-t border-blue-500 mt-2 pt-2">
              <div className="px-3 py-2 text-blue-200 text-sm">
                Logged in as: <span className="font-medium text-white">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-200 hover:bg-red-500 hover:text-white"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
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

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewProject(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Create New Project</h3>
              <button onClick={() => setShowNewProject(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2nd Floor Construction"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
                <input
                  type="number"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2500000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ₹{(parseFloat(newProjectBudget) / 100000 || 0).toFixed(1)} Lakhs
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close project menu */}
      {showProjectMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
      )}
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
