import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Filter } from 'lucide-react';
import { getTransactions, getSettings, getParties } from '../utils/api';
import { formatCurrency, formatDate, safeDate } from '../utils/helpers';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function CompanyLedger({ onBack, refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [parties, setParties] = useState([]);
  const [settings, setSettings] = useState({});
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [filter, setFilter] = useState('all'); // all, purchases, payments
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    calculateLedger();
  }, [transactions, parties, filter, dateRange]);

  const loadData = async () => {
    const [txns, partiesList, settingsData] = await Promise.all([
      getTransactions(),
      getParties(),
      getSettings()
    ]);
    setTransactions(txns);
    setParties(partiesList);
    setSettings(settingsData);
  };

  const getPartyName = (partyId) => {
    const party = parties.find(p => p.id === partyId);
    return party?.name || 'Cash/Unknown';
  };

  const calculateLedger = () => {
    let filteredTxns = [...transactions];

    // Apply type filter
    if (filter === 'purchases') {
      filteredTxns = filteredTxns.filter(t => t.type === 'purchase');
    } else if (filter === 'payments') {
      filteredTxns = filteredTxns.filter(t => t.type === 'payment');
    }

    // Apply date filter
    if (dateRange.start) {
      filteredTxns = filteredTxns.filter(t => t.date >= dateRange.start);
    }
    if (dateRange.end) {
      filteredTxns = filteredTxns.filter(t => t.date <= dateRange.end);
    }

    // Sort by date
    filteredTxns.sort((a, b) => safeDate(a.date) - safeDate(b.date));

    // Calculate running balance (Cash Flow perspective)
    // Purchases = Money going out (negative)
    // Payments to parties = Money going out (negative)
    // Received from parties = Money coming in (positive)
    let runningBalance = 0;
    
    const entries = filteredTxns.map(txn => {
      const debit = parseFloat(txn.purchaseAmount) || parseFloat(txn.credit) || 0; // Money out
      const credit = parseFloat(txn.debit) || 0; // Money in
      
      runningBalance = runningBalance - debit + credit;

      return {
        ...txn,
        partyName: getPartyName(txn.partyId),
        debitAmount: debit,
        creditAmount: credit,
        balance: runningBalance
      };
    });

    setLedgerEntries(entries);
  };

  const totalDebits = ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredits = ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);
  const netBalance = totalCredits - totalDebits;

  const handleExportCSV = () => {
    const csv = [
      [`COMPANY LEDGER - ${settings.projectName || 'Home Construction'}`],
      [`Generated: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`],
      [''],
      ['Date', 'Particulars', 'Party', 'Vch No', 'Type', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
      ...ledgerEntries.map(e => [
        formatDate(e.date),
        `"${e.description}"`,
        `"${e.partyName}"`,
        e.voucherNo,
        e.type || 'Entry',
        e.debitAmount || '',
        e.creditAmount || '',
        e.balance
      ]),
      ['', '', '', '', 'TOTAL', totalDebits, totalCredits, netBalance]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Company_Ledger_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPANY LEDGER', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.projectName || 'Home Construction Project', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Statement Date: ${format(new Date(), 'dd MMM yyyy')}`, 105, 35, { align: 'center' });

    // Summary
    doc.setFontSize(10);
    doc.text(`Total Entries: ${ledgerEntries.length}`, 14, 45);
    doc.text(`Total Debit: Rs. ${totalDebits.toLocaleString('en-IN')}`, 14, 51);
    doc.text(`Total Credit: Rs. ${totalCredits.toLocaleString('en-IN')}`, 100, 51);
    doc.text(`Net Balance: Rs. ${Math.abs(netBalance).toLocaleString('en-IN')} ${netBalance < 0 ? 'Dr' : 'Cr'}`, 14, 57);

    // Table
    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Particulars', 'Party', 'Vch No', 'Debit', 'Credit', 'Balance']],
      body: ledgerEntries.map(e => [
        format(new Date(e.date), 'dd-MM-yy'),
        e.description?.substring(0, 25) || '',
        e.partyName?.substring(0, 15) || '',
        e.voucherNo || '',
        e.debitAmount ? `₹${e.debitAmount.toLocaleString('en-IN')}` : '',
        e.creditAmount ? `₹${e.creditAmount.toLocaleString('en-IN')}` : '',
        `₹${Math.abs(e.balance).toLocaleString('en-IN')} ${e.balance < 0 ? 'Dr' : 'Cr'}`
      ]),
      foot: [['', '', '', 'TOTAL', 
        `₹${totalDebits.toLocaleString('en-IN')}`, 
        `₹${totalCredits.toLocaleString('en-IN')}`,
        `₹${Math.abs(netBalance).toLocaleString('en-IN')} ${netBalance < 0 ? 'Dr' : 'Cr'}`
      ]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Company_Ledger_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="flex gap-1">
            {['all', 'purchases', 'payments'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm capitalize ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center ml-auto">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-2 py-1.5 border rounded text-xs sm:text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-2 py-1.5 border rounded text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Ledger Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white p-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-wide">COMPANY LEDGER</h1>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1">{settings.projectName || 'Home Construction'}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs">Date</p>
              <p className="font-semibold text-sm sm:text-base">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 border-b">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Debit</p>
            <p className="font-bold text-red-600 text-sm sm:text-lg">₹{totalDebits.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Credit</p>
            <p className="font-bold text-green-600 text-sm sm:text-lg">₹{totalCredits.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Net Balance</p>
            <p className={`font-bold text-sm sm:text-lg ${netBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{Math.abs(netBalance).toLocaleString('en-IN')}
              <span className="text-xs ml-1">{netBalance < 0 ? 'Dr' : 'Cr'}</span>
            </p>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y max-h-[60vh] overflow-y-auto">
          {ledgerEntries.length > 0 ? (
            ledgerEntries.map((entry, idx) => (
              <div key={entry.id || idx} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{entry.description}</p>
                    <p className="text-xs text-gray-500">{entry.partyName}</p>
                    <p className="text-xs text-gray-400">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.type === 'purchase' ? 'bg-orange-100 text-orange-700' : 
                    entry.type === 'payment' ? 'bg-green-100 text-green-700' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.type === 'purchase' ? 'Purchase' : 'Payment'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-3">
                    {entry.debitAmount > 0 && (
                      <span className="text-red-600">Dr: ₹{entry.debitAmount.toLocaleString('en-IN')}</span>
                    )}
                    {entry.creditAmount > 0 && (
                      <span className="text-green-600">Cr: ₹{entry.creditAmount.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <span className={`font-bold ${entry.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.abs(entry.balance).toLocaleString('en-IN')}
                    <span className="text-xs ml-0.5">{entry.balance < 0 ? 'Dr' : 'Cr'}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>No transactions found</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-600">Date</th>
                <th className="text-left p-3 font-semibold text-slate-600">Particulars</th>
                <th className="text-left p-3 font-semibold text-slate-600">Party</th>
                <th className="text-left p-3 font-semibold text-slate-600">Vch No</th>
                <th className="text-left p-3 font-semibold text-slate-600">Type</th>
                <th className="text-right p-3 font-semibold text-slate-600">Debit (₹)</th>
                <th className="text-right p-3 font-semibold text-slate-600">Credit (₹)</th>
                <th className="text-right p-3 font-semibold text-slate-600">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ledgerEntries.map((entry, idx) => (
                <tr key={entry.id || idx} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-600">{format(new Date(entry.date), 'dd-MM-yy')}</td>
                  <td className="p-3 text-slate-800 max-w-[200px] truncate">{entry.description}</td>
                  <td className="p-3 text-slate-600">{entry.partyName}</td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{entry.voucherNo}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      entry.type === 'purchase' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {entry.type === 'purchase' ? 'Purchase' : 'Payment'}
                    </span>
                  </td>
                  <td className="p-3 text-right text-red-600 font-medium">
                    {entry.debitAmount > 0 ? entry.debitAmount.toLocaleString('en-IN') : '-'}
                  </td>
                  <td className="p-3 text-right text-green-600 font-medium">
                    {entry.creditAmount > 0 ? entry.creditAmount.toLocaleString('en-IN') : '-'}
                  </td>
                  <td className={`p-3 text-right font-bold ${entry.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(entry.balance).toLocaleString('en-IN')}
                    <span className="text-xs ml-1">{entry.balance < 0 ? 'Dr' : 'Cr'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td colSpan={5} className="p-3 font-bold text-slate-700 text-right">TOTAL</td>
                <td className="p-3 text-right font-bold text-red-600">
                  {totalDebits.toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-bold text-green-600">
                  {totalCredits.toLocaleString('en-IN')}
                </td>
                <td className={`p-3 text-right font-bold ${netBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(netBalance).toLocaleString('en-IN')}
                  <span className="text-xs ml-1">{netBalance < 0 ? 'Dr' : 'Cr'}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Entry Count */}
      <p className="text-center text-xs text-gray-400">
        Showing {ledgerEntries.length} entries
      </p>
    </div>
  );
}

export default CompanyLedger;
