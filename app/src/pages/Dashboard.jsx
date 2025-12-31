import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, Plus, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getStats, getTransactions, getCategories, getParties } from '../utils/storage';
import { formatCurrency, formatCurrencyFull, formatDateDisplay } from '../utils/helpers';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStats(getStats());
    setRecentTransactions(getTransactions().slice(0, 5));
    setCategories(getCategories());
    setParties(getParties());
  };

  if (!stats) return <div className="text-center py-10">Loading...</div>;

  const categoryData = categories
    .filter(c => c.id !== 'income' && stats.categoryWise[c.id])
    .map((c, i) => ({
      name: c.name,
      value: stats.categoryWise[c.id] || 0,
      color: COLORS[i % COLORS.length],
      icon: c.icon
    }));

  const outstandingParties = parties.filter(p => p.currentBalance !== 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Add Button */}
      <button
        onClick={() => onNavigate('add')}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
      >
        <Plus size={20} />
        <span className="text-base sm:text-lg font-semibold">Add New Entry</span>
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatCard
          title="Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Received"
          value={formatCurrency(stats.totalReceived)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Budget"
          value={formatCurrency(stats.budget)}
          icon={Target}
          color="blue"
        />
        <StatCard
          title="Remaining"
          value={formatCurrency(stats.remaining)}
          icon={Wallet}
          color={stats.remaining > 0 ? 'green' : 'red'}
        />
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Budget Progress</h3>
          <span className={`text-xs sm:text-sm font-bold ${stats.percentUsed > 90 ? 'text-red-500' : 'text-blue-600'}`}>
            {stats.percentUsed}%
          </span>
        </div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              stats.percentUsed > 90 ? 'bg-red-500' : stats.percentUsed > 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(Math.max(stats.percentUsed || 0, 0), 100)}%`, minWidth: stats.percentUsed > 0 ? '8px' : '0' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-500">
          <span>Spent: {formatCurrency(stats.totalSpent)}</span>
          <span>Budget: {formatCurrency(stats.budget)}</span>
        </div>
      </div>

      {/* Category Breakdown & Outstanding */}
      <div className="grid gap-4 sm:gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Category Breakdown</h3>
          {categoryData.length > 0 ? (
            <>
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-3">
                {categoryData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 truncate">{item.icon} {item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-400 text-sm">
              No transactions yet
            </div>
          )}
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Outstanding Balances</h3>
          {outstandingParties.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
              {outstandingParties.slice(0, 5).map(party => (
                <div key={party.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700 text-sm sm:text-base truncate mr-2">{party.name}</span>
                  <span className={`font-bold text-sm sm:text-base flex-shrink-0 ${party.currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(party.currentBalance)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-400 text-sm">
              No outstanding balances
            </div>
          )}
          {outstandingParties.length > 5 && (
            <button 
              onClick={() => onNavigate('parties')}
              className="text-blue-600 text-xs sm:text-sm mt-2 sm:mt-3 hover:underline"
            >
              View all {outstandingParties.length} parties →
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-5">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Recent Transactions</h3>
          <button 
            onClick={() => onNavigate('transactions')}
            className="text-blue-600 text-xs sm:text-sm flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {recentTransactions.map(txn => (
              <div key={txn.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base truncate">{txn.partyName || 'Unknown'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{txn.description}</p>
                  <p className="text-xs text-gray-400">{formatDateDisplay(txn.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {txn.credit > 0 && (
                    <p className="font-bold text-red-500 text-sm sm:text-base">-{formatCurrency(txn.credit)}</p>
                  )}
                  {txn.debit > 0 && (
                    <p className="font-bold text-green-500 text-sm sm:text-base">+{formatCurrency(txn.debit)}</p>
                  )}
                  {txn.purchaseAmount > 0 && (
                    <p className="font-bold text-orange-500 text-sm sm:text-base">{formatCurrency(txn.purchaseAmount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <p className="text-sm">No transactions yet</p>
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

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100'
  };

  return (
    <div className={`p-3 sm:p-4 rounded-xl border-2 ${colors[color]}`}>
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
        <span className="text-xs sm:text-sm font-medium opacity-80">{title}</span>
      </div>
      <p className="text-base sm:text-xl font-bold">{value}</p>
    </div>
  );
}

export default Dashboard;
