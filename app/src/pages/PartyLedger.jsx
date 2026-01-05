import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Phone, Printer, FileText } from 'lucide-react';
import { getParties, getTransactions } from '../utils/api';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, safeDate } from '../utils/helpers';

function PartyLedger({ partyId, onBack }) {
  const [party, setParty] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);

  useEffect(() => {
    if (partyId) {
      loadData();
    }
  }, [partyId]);

  const loadData = async () => {
    const [parties, allTransactions] = await Promise.all([
      getParties(),
      getTransactions()
    ]);
    const foundParty = parties.find(p => p.id === partyId);
    setParty(foundParty);

    const partyTxns = allTransactions
      .filter(t => t.partyId === partyId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate ledger with running balance (like bank statement)
    let runningBalance = parseFloat(foundParty?.openingBalance) || 0;
    const entries = partyTxns.map(txn => {
      const debit = parseFloat(txn.purchaseAmount) || 0;
      const credit = parseFloat(txn.credit) || 0;
      
      // Debit increases what we owe (negative), Credit reduces it
      runningBalance = runningBalance - debit + credit;

      return {
        ...txn,
        debit,
        credit,
        balance: runningBalance
      };
    });

    setLedgerEntries(entries);
  };

  const handleExport = () => {
    if (!party) return;

    const csv = [
      [`LEDGER ACCOUNT`],
      [`Account Name: ${party.name}`],
      [`Account Type: ${party.type}`],
      [`Phone: ${party.phone || 'N/A'}`],
      [`Statement Date: ${format(new Date(), 'dd-MM-yyyy')}`],
      [''],
      ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
      [`-`, `Opening Balance`, `-`, `-`, ``, ``, `${party.openingBalance || 0}`],
      ...ledgerEntries.map(e => [
        formatDate(e.date),
        `"${e.description}"`,
        e.type || 'Entry',
        e.voucherNo,
        e.debit || '',
        e.credit || '',
        e.balance
      ]),
      ['', '', '', 'TOTAL', totalDebits, totalCredits, currentBalance]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${party.name.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = () => {
    if (!party) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(51, 65, 85); // slate-700
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LEDGER ACCOUNT', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Statement of Account', 14, 26);
    
    doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 18, { align: 'right' });

    // Account Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Account: ${party.name}`, 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${party.type}`, 14, 52);
    doc.text(`Contact: ${party.phone || '-'}`, 14, 59);
    
    const obText = `Opening Balance: ₹${Math.abs(openingBalance).toLocaleString('en-IN')} ${openingBalance < 0 ? '(Dr)' : openingBalance > 0 ? '(Cr)' : ''}`;
    doc.text(obText, pageWidth - 14, 52, { align: 'right' });

    // Table Data
    const tableData = [
      ['-', 'Opening Balance B/F', '-', '-', '-', '-', `${Math.abs(openingBalance).toLocaleString('en-IN')} ${openingBalance < 0 ? 'Dr' : openingBalance > 0 ? 'Cr' : ''}`],
      ...ledgerEntries.map(e => [
        formatDate(e.date),
        e.description,
        e.type === 'purchase' ? 'Purchase' : e.type === 'payment' ? 'Payment' : 'Entry',
        e.voucherNo,
        e.debit > 0 ? e.debit.toLocaleString('en-IN') : '-',
        e.credit > 0 ? e.credit.toLocaleString('en-IN') : '-',
        `${Math.abs(e.balance).toLocaleString('en-IN')} ${e.balance < 0 ? 'Dr' : e.balance > 0 ? 'Cr' : ''}`
      ])
    ];

    // AutoTable
    autoTable(doc, {
      startY: 68,
      head: [['Date', 'Particulars', 'Type', 'Vch No', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']],
      body: tableData,
      foot: [
        ['', '', '', 'TOTAL', totalDebits.toLocaleString('en-IN'), totalCredits.toLocaleString('en-IN'), ''],
        ['', '', '', 'CLOSING BALANCE', '', '', `₹${Math.abs(currentBalance).toLocaleString('en-IN')} ${currentBalance < 0 ? 'Dr' : currentBalance > 0 ? 'Cr' : ''}`]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      footStyles: {
        fillColor: [51, 65, 85], // slate-700
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { left: 14, right: 14 }
    });

    // Summary at bottom
    const finalY = (doc).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Summary boxes
    doc.setDrawColor(200, 200, 200);
    
    // Total Debit
    doc.rect(14, finalY, 55, 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Debit', 16, finalY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // red
    doc.text(`₹${totalDebits.toLocaleString('en-IN')}`, 16, finalY + 15);
    
    // Total Credit
    doc.setTextColor(0, 0, 0);
    doc.rect(74, finalY, 55, 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Credit', 76, finalY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // green
    doc.text(`₹${totalCredits.toLocaleString('en-IN')}`, 76, finalY + 15);
    
    // Net Balance
    doc.setTextColor(0, 0, 0);
    doc.rect(134, finalY, 62, 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Net Balance', 136, finalY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(currentBalance < 0 ? 220 : 22, currentBalance < 0 ? 38 : 163, currentBalance < 0 ? 38 : 74);
    doc.text(`₹${Math.abs(currentBalance).toLocaleString('en-IN')} ${currentBalance < 0 ? '(Payable)' : '(Receivable)'}`, 136, finalY + 15);

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dr = Amount we owe to party | Cr = Amount paid to party', pageWidth / 2, finalY + 30, { align: 'center' });
    doc.text(`Generated on ${format(new Date(), 'dd-MM-yyyy HH:mm')}`, pageWidth / 2, finalY + 36, { align: 'center' });

    // Save PDF
    doc.save(`Ledger_${party.name.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  if (!party) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Party not found</p>
        <button onClick={onBack} className="text-blue-600 mt-2 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const openingBalance = parseFloat(party.openingBalance) || 0;
  const totalDebits = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
  const currentBalance = ledgerEntries.length > 0 
    ? ledgerEntries[ledgerEntries.length - 1].balance 
    : openingBalance;

  return (
    <div className="space-y-3 print:space-y-2">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handlePDF}
            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <FileText size={16} />
            <span className="hidden xs:inline">PDF</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download size={16} />
            <span className="hidden xs:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Bank Style Ledger */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Ledger Header - Like Bank Statement */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 sm:p-6 print:bg-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-wide">LEDGER ACCOUNT</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">Statement of Account</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-xs">Date</p>
              <p className="font-semibold text-sm sm:text-base">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-b bg-slate-50 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Account</p>
              <p className="font-bold text-slate-800 text-sm sm:text-lg truncate">{party.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Type</p>
              <p className="font-semibold text-slate-700 capitalize text-sm sm:text-base">{party.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Contact</p>
              <p className="font-semibold text-slate-700 text-sm sm:text-base">{party.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Opening Bal</p>
              <p className={`font-bold text-sm sm:text-lg ${openingBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                ₹{Math.abs(openingBalance).toLocaleString('en-IN')}
                <span className="text-xs ml-1">{openingBalance < 0 ? 'Dr' : openingBalance > 0 ? 'Cr' : ''}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {/* Opening Balance Card */}
          <div className="p-3 bg-amber-50 border-b">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700 text-sm">Opening Balance B/F</span>
              <span className="font-bold text-slate-800">
                ₹{Math.abs(openingBalance).toLocaleString('en-IN')}
                <span className="text-xs ml-1">{openingBalance < 0 ? 'Dr' : openingBalance > 0 ? 'Cr' : ''}</span>
              </span>
            </div>
          </div>

          {/* Transaction Cards */}
          <div className="divide-y">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="p-3 hover:bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{entry.description}</p>
                    <p className="text-xs text-slate-500">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.type === 'purchase' ? 'bg-orange-100 text-orange-700' : 
                    entry.type === 'payment' ? 'bg-green-100 text-green-700' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {entry.type === 'purchase' ? 'Purchase' : entry.type === 'payment' ? 'Payment' : 'Entry'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-4">
                    {entry.debit > 0 && (
                      <span className="text-red-600">Dr: ₹{entry.debit.toLocaleString('en-IN')}</span>
                    )}
                    {entry.credit > 0 && (
                      <span className="text-green-600">Cr: ₹{entry.credit.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-800">
                    Bal: ₹{Math.abs(entry.balance).toLocaleString('en-IN')}
                    <span className="text-xs ml-1">{entry.balance < 0 ? 'Dr' : entry.balance > 0 ? 'Cr' : ''}</span>
                  </span>
                </div>
              </div>
            ))}

            {ledgerEntries.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">
                No transactions recorded yet
              </div>
            )}
          </div>

          {/* Mobile Closing Balance */}
          <div className="p-4 bg-slate-800 text-white">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase text-sm">Closing Balance</span>
              <span className="font-bold text-xl">
                ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
                <span className="text-sm ml-1">{currentBalance < 0 ? 'Dr' : currentBalance > 0 ? 'Cr' : ''}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="py-3 px-4 text-left font-bold text-slate-700 uppercase text-xs tracking-wider">Date</th>
                <th className="py-3 px-4 text-left font-bold text-slate-700 uppercase text-xs tracking-wider">Particulars</th>
                <th className="py-3 px-4 text-center font-bold text-slate-700 uppercase text-xs tracking-wider">Vch Type</th>
                <th className="py-3 px-4 text-center font-bold text-slate-700 uppercase text-xs tracking-wider">Vch No</th>
                <th className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-xs tracking-wider bg-red-50">Debit (₹)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-xs tracking-wider bg-green-50">Credit (₹)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-xs tracking-wider bg-blue-50">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Opening Balance Row */}
              <tr className="bg-amber-50">
                <td className="py-3 px-4 text-slate-500">-</td>
                <td className="py-3 px-4 font-semibold text-slate-700">Opening Balance B/F</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-right bg-red-50/50">-</td>
                <td className="py-3 px-4 text-right bg-green-50/50">-</td>
                <td className="py-3 px-4 text-right font-bold bg-blue-50/50">
                  {Math.abs(openingBalance).toLocaleString('en-IN')}
                  <span className="text-xs text-slate-500 ml-1">{openingBalance < 0 ? 'Dr' : openingBalance > 0 ? 'Cr' : ''}</span>
                </td>
              </tr>
              
              {ledgerEntries.map((entry, i) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {format(new Date(entry.date), 'dd-MM-yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{entry.description}</p>
                    {entry.reference && (
                      <p className="text-xs text-slate-400">Ref: {entry.reference}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.type === 'purchase' ? 'bg-orange-100 text-orange-700' : 
                      entry.type === 'payment' ? 'bg-green-100 text-green-700' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {entry.type === 'purchase' ? 'Purchase' : entry.type === 'payment' ? 'Payment' : 'Entry'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 text-xs">{entry.voucherNo}</td>
                  <td className="py-3 px-4 text-right bg-red-50/30">
                    {entry.debit > 0 ? (
                      <span className="text-red-600 font-semibold">{entry.debit.toLocaleString('en-IN')}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right bg-green-50/30">
                    {entry.credit > 0 ? (
                      <span className="text-green-600 font-semibold">{entry.credit.toLocaleString('en-IN')}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right bg-blue-50/30 font-bold">
                    {Math.abs(entry.balance).toLocaleString('en-IN')}
                    <span className="text-xs text-slate-500 ml-1">{entry.balance < 0 ? 'Dr' : entry.balance > 0 ? 'Cr' : ''}</span>
                  </td>
                </tr>
              ))}

              {ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No transactions recorded yet
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300">
                <td colSpan="4" className="py-3 px-4 font-bold text-slate-700 text-right uppercase text-xs">
                  Total
                </td>
                <td className="py-3 px-4 text-right bg-red-100 font-bold text-red-700">
                  {totalDebits.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right bg-green-100 font-bold text-green-700">
                  {totalCredits.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right bg-blue-100"></td>
              </tr>
              <tr className="bg-slate-800 text-white">
                <td colSpan="4" className="py-4 px-4 font-bold text-right uppercase tracking-wide">
                  Closing Balance C/F
                </td>
                <td className="py-4 px-4 text-right bg-slate-700"></td>
                <td className="py-4 px-4 text-right bg-slate-700"></td>
                <td className="py-4 px-4 text-right font-bold text-xl">
                  ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
                  <span className="text-sm ml-1">{currentBalance < 0 ? 'Dr' : currentBalance > 0 ? 'Cr' : ''}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">Debit</p>
              <p className="text-sm sm:text-lg font-bold text-red-600">₹{totalDebits.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 sm:p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">Credit</p>
              <p className="text-sm sm:text-lg font-bold text-green-600">₹{totalCredits.toLocaleString('en-IN')}</p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg border ${currentBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-xs text-slate-500 uppercase">Balance</p>
              <p className={`text-sm sm:text-lg font-bold ${currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            Dr = Amount we owe to party | Cr = Amount paid to party
          </p>
        </div>
      </div>
    </div>
  );
}

export default PartyLedger;
