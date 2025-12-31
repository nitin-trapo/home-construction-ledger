import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Download, FileText } from 'lucide-react';
import { getTransactions, getCategories, getStats } from '../utils/storage';
import { formatCurrency, formatCurrencyFull } from '../utils/helpers';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function Reports({ onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setStats(getStats());
  }, []);

  // Monthly spending data
  const getMonthlyData = () => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTxns = transactions.filter(t => {
        const txnDate = parseISO(t.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      const spent = monthTxns.reduce((sum, t) => sum + (t.credit || 0), 0);
      const received = monthTxns.reduce((sum, t) => sum + (t.debit || 0), 0);

      return {
        month: format(month, 'MMM'),
        spent,
        received
      };
    });
  };

  // Category data for pie chart
  const getCategoryData = () => {
    const categoryTotals = {};
    
    transactions.forEach(t => {
      if (t.category && t.category !== 'income' && t.credit > 0) {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += t.credit;
      }
    });

    return categories
      .filter(c => c.id !== 'income' && categoryTotals[c.id])
      .map((c, i) => ({
        name: c.name,
        value: categoryTotals[c.id],
        icon: c.icon,
        color: COLORS[i % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Sub-category breakdown
  const getSubCategoryData = () => {
    const subCatTotals = {};
    
    transactions.forEach(t => {
      if (t.subCategory && t.credit > 0) {
        const key = `${t.category}-${t.subCategory}`;
        if (!subCatTotals[key]) {
          subCatTotals[key] = { category: t.category, subCategory: t.subCategory, total: 0 };
        }
        subCatTotals[key].total += t.credit;
      }
    });

    return Object.values(subCatTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const subCategoryData = getSubCategoryData();

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      categoryBreakdown: categoryData,
      monthlyTrend: monthlyData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construction_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  if (!stats) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Reports</h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate?.('companyLedger')}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Full Ledger</span>
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'category', label: 'Category' },
          { id: 'monthly', label: 'Monthly' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <SummaryCard title="Spent" value={formatCurrency(stats.totalSpent)} color="red" />
            <SummaryCard title="Received" value={formatCurrency(stats.totalReceived)} color="green" />
            <SummaryCard title="Budget" value={formatCurrency(stats.budget)} color="blue" />
            <SummaryCard title="Remaining" value={formatCurrency(stats.remaining)} color={stats.remaining > 0 ? 'green' : 'red'} />
          </div>

          {/* Budget Progress */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-5">
            <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Budget Utilization</h3>
            <div className="h-4 sm:h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  stats.percentUsed > 90 ? 'bg-red-500' : stats.percentUsed > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs sm:text-sm">
              <span className="text-gray-500">Used: {stats.percentUsed}%</span>
              <span className="text-gray-500">Left: {100 - stats.percentUsed}%</span>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-5">
            <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Top Expenses</h3>
            <div className="space-y-2 sm:space-y-3">
              {subCategoryData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 text-sm sm:text-base truncate">{item.subCategory}</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm sm:text-base flex-shrink-0">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Tab */}
      {activeTab === 'category' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-5">
            <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Category Breakdown</h3>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
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
                <div className="space-y-1.5 sm:space-y-2">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700 text-sm sm:text-base truncate">{item.icon} {item.name}</span>
                      </div>
                      <span className="font-bold text-sm sm:text-base flex-shrink-0">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-6 sm:py-8 text-gray-400 text-sm">No data available</p>
            )}
          </div>

          {/* Bar Chart by Category */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Category Comparison</h3>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400">No data available</p>
            )}
          </div>
        </div>
      )}

      {/* Monthly Trend Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Line Chart */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Spending Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                  <Line type="monotone" dataKey="spent" stroke="#EF4444" strokeWidth={2} name="Spent" />
                  <Line type="monotone" dataKey="received" stroke="#10B981" strokeWidth={2} name="Received" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Month</th>
                    <th className="text-right py-2 px-3">Spent</th>
                    <th className="text-right py-2 px-3">Received</th>
                    <th className="text-right py-2 px-3">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 px-3 font-medium">{m.month}</td>
                      <td className="py-2 px-3 text-right text-red-500">{formatCurrency(m.spent)}</td>
                      <td className="py-2 px-3 text-right text-green-500">{formatCurrency(m.received)}</td>
                      <td className={`py-2 px-3 text-right font-bold ${m.received - m.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(m.received - m.spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${colors[color]}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

export default Reports;
