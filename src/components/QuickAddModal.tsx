/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, Loan, TransactionType, LoanType } from '../types';
import { X, Plus, Calendar, User, FileText } from 'lucide-react';
import { CategoryIcon, getCategoryIconName } from '../utils/icons';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'loan' | null;
  expenseCategories: string[];
  incomeCategories: string[];
  categoryIcons: Record<string, string>;
  people: string[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAddLoan: (loan: Omit<Loan, 'id' | 'paidAmount' | 'status' | 'repayments'>) => void;
  currencySymbol: string;
}

export default function QuickAddModal({ 
  isOpen, 
  onClose, 
  defaultType, 
  expenseCategories,
  incomeCategories,
  categoryIcons,
  people,
  onAddTransaction, 
  onAddLoan,
  currencySymbol
}: QuickAddModalProps) {
  // Helper to get local date in YYYY-MM-DD format
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tabs: 0: Chi tiêu, 1: Thu nhập, 2: Khoản vay
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  
  // Transaction input states
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(getTodayString());
  const [txNote, setTxNote] = useState('');

  // Loan input states
  const [loanType, setLoanType] = useState<LoanType>('lend'); // Always default to 'lend' as requested
  const [loanPerson, setLoanPerson] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDate, setLoanDate] = useState(getTodayString());
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNote, setLoanNote] = useState('');

  // Helper to format date to dd/mm/yy format
  const renderFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Helper formatting function: adds dot separators for thousands
  const formatNumberWithDots = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (valRaw: string, setter: (v: string) => void) => {
    setter(formatNumberWithDots(valRaw));
  };

  // Dynamic suggestions logic based on user inputs
  const getDynamicSuggestions = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    const isUSD = currencySymbol === '$';

    if (isUSD) {
      if (!digits) {
        return [
          { value: '5', label: '$5' },
          { value: '10', label: '$10' },
          { value: '20', label: '$20' },
          { value: '50', label: '$50' },
          { value: '100', label: '$100' },
          { value: '200', label: '$200' },
          { value: '500', label: '$500' },
          { value: '1000', label: '$1K' },
        ];
      }
      const num = parseInt(digits, 10);
      if (isNaN(num)) return [];
      
      const res = [];
      const multipliers = [10, 100, 1000, 10000];
      for (const m of multipliers) {
        const val = num * m;
        if (val <= 1000000) {
          res.push({
            value: val.toString(),
            label: `$${val.toLocaleString('en-US')}`
          });
        }
      }
      return res;
    } else {
      // VND
      if (!digits) {
        return [
          { value: '10000', label: '10.000 đ' },
          { value: '20000', label: '20.000 đ' },
          { value: '50000', label: '50.000 đ' },
          { value: '100000', label: '100.000 đ' },
          { value: '200000', label: '200.000 đ' },
          { value: '500000', label: '500.000 đ' },
          { value: '1000000', label: '1.000.000 đ' },
          { value: '2000000', label: '2.000.000 đ' },
          { value: '5000000', label: '5.000.000 đ' },
          { value: '10000000', label: '10.000.000 đ' },
          { value: '20000000', label: '20.000.000 đ' },
          { value: '50000000', label: '50.000.000 đ' },
        ];
      }
      const num = parseInt(digits, 10);
      if (isNaN(num)) return [];

      const res = [];
      const multipliers = [1000, 10000, 100000, 1000000, 10000000, 100000000];
      for (const m of multipliers) {
        const val = num * m;
        if (val >= 10000 && val <= 99999999) {
          res.push({
            value: val.toString(),
            label: val.toLocaleString('vi-VN') + ' đ'
          });
        }
      }
      return res;
    }
  };

  const handleSelectSuggestion = (val: string, setter: (v: string) => void) => {
    setter(formatNumberWithDots(val));
  };

  // Sync state if defaultType parameter changes
  useEffect(() => {
    if (isOpen) {
      const today = getTodayString();
      setTxDate(today);
      setLoanDate(today);
      if (defaultType === 'expense') {
        setActiveTab(0);
        setTxType('expense');
        setTxCategory(expenseCategories[0] || '');
      } else if (defaultType === 'income') {
        setActiveTab(1);
        setTxType('income');
        setTxCategory(incomeCategories[0] || '');
      } else if (defaultType === 'loan') {
        setActiveTab(2);
      } else {
        // Fallback or neutral
        setActiveTab(0);
        setTxType('expense');
        setTxCategory(expenseCategories[0] || '');
      }
    }
  }, [defaultType, isOpen, expenseCategories, incomeCategories]);

  // Handle activeTab sync for txType/txCategory
  useEffect(() => {
    if (activeTab === 0) {
      setTxType('expense');
      setTxCategory(expenseCategories[0] || '');
    } else if (activeTab === 1) {
      setTxType('income');
      setTxCategory(incomeCategories[0] || '');
    }
  }, [activeTab, expenseCategories, incomeCategories]);

  // Compute 30-day loan term due date (to 1st of corresponding month with 10-day buffer)
  const computeDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-indexed (1-12)
    const day = parseInt(parts[2], 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const remainingDays = daysInMonth - day;

    const targetMonth = month + (remainingDays >= 10 ? 1 : 2);
    
    let targetYear = year;
    let finalMonth = targetMonth;
    while (finalMonth > 12) {
      finalMonth -= 12;
      targetYear += 1;
    }
    const mm = String(finalMonth).padStart(2, '0');
    return `${targetYear}-${mm}-01`;
  };

  useEffect(() => {
    if (loanDate) {
      setLoanDueDate(computeDueDate(loanDate));
    }
  }, [loanDate, loanType]);

  if (!isOpen) return null;

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = txAmount.replace(/\D/g, '');
    const parsedAmount = parseFloat(rawDigits);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ lớn hơn 0!');
      return;
    }

    onAddTransaction({
      type: txType,
      amount: parsedAmount,
      category: txCategory || (txType === 'expense' ? (expenseCategories[0] || '') : (incomeCategories[0] || '')),
      date: txDate,
      note: txNote.trim(),
    });

    // Reset inputs
    setTxAmount('');
    setTxNote('');
    onClose();
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = loanAmount.replace(/\D/g, '');
    const parsedAmount = parseFloat(rawDigits);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ lớn hơn 0!');
      return;
    }
    if (!loanPerson.trim()) {
      alert('Vui lòng cung cấp tên đối tác nợ!');
      return;
    }

    onAddLoan({
      type: loanType,
      person: loanPerson.trim(),
      amount: parsedAmount,
      date: loanDate,
      dueDate: loanDueDate || undefined,
      note: loanNote.trim(),
    });

    // Reset inputs
    setLoanAmount('');
    setLoanPerson('');
    setLoanNote('');
    setLoanDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="quickadd-overlay">
      {/* Dimmed backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity" 
      />

      {/* Frame modal sheet */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 flex flex-col max-h-[90vh] animate-scale-up">
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 backdrop-blur">
          <h2 className="text-sm font-display font-semibold text-white">Thêm Giao Dịch Nhanh</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slidable Segmented Controls (Unify with Sổ Sách Layout) */}
        <div className="flex bg-neutral-950 p-1 mx-5 mt-4 rounded-xl border border-neutral-800 relative" id="adding-selector">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative z-10 ${
              activeTab === 0 
                ? 'text-black font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🔴 Chi Tiêu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative z-10 ${
              activeTab === 1 
                ? 'text-black font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🟢 Thu Nhập
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative z-10 ${
              activeTab === 2 
                ? 'text-black font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🤝 Khoản Vay
          </button>

          {/* Background Sliding Indicator */}
          <div 
            className="absolute top-1 bottom-1 bg-orange-500 rounded-lg transition-all duration-300 ease-out"
            style={{
              left: `calc(${(activeTab * 33.333)}% + 4px)`,
              width: 'calc(33.333% - 8px)'
            }}
          />
        </div>

        {/* Scrollable Form Area */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-neutral-200">
          
          {/* TAB 1 & 2: EXPENSE AND INCOME FORM */}
          {(activeTab === 0 || activeTab === 1) && (
            <form onSubmit={handleTxSubmit} className="space-y-4">
              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium font-sans">
                  Số tiền {activeTab === 0 ? 'chi tiêu' : 'thu về'} ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-orange-500 font-mono">
                    {currencySymbol}
                  </span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    required
                    value={txAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setTxAmount)}
                    placeholder="0"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono focus:outline-none focus:border-orange-500 text-sm"
                    autoFocus
                  />
                </div>
                
                {/* Click Suggested Amount Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" id="tx-amount-suggestions">
                  <span className="text-[10px] text-neutral-500 whitespace-nowrap mr-0.5">Gợi ý:</span>
                  {getDynamicSuggestions(txAmount).map((sug) => (
                    <button
                      key={sug.value}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug.value, setTxAmount)}
                      className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium font-sans">Ngày thực hiện</label>
                <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl flex items-center pl-10 pr-4 py-2.5 focus-within:border-orange-500 transition-colors">
                  <Calendar className="w-4 h-4 absolute left-3.5 text-neutral-450 pointer-events-none" />
                  <span className="text-xs font-mono text-white select-none">
                    {renderFriendlyDate(txDate) || 'Chọn ngày'}
                  </span>
                  <input 
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                </div>
              </div>

               {/* Category selector */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium font-sans">Danh mục phân loại</label>
                <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1" id="addmodal-category-grid">
                  {(activeTab === 0 ? expenseCategories : incomeCategories).map((cat) => {
                    const isSelected = txCategory === cat;
                    const iconName = getCategoryIconName(cat, categoryIcons);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTxCategory(cat)}
                        className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 border transition-all text-center cursor-pointer ${
                          isSelected 
                            ? activeTab === 0
                              ? 'bg-red-500/10 border-red-500/50 text-red-400 font-bold scale-[1.02]'
                              : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold scale-[1.02]'
                            : 'bg-neutral-950/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected 
                            ? activeTab === 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
                            : 'bg-neutral-900 border border-neutral-800/30'
                        }`}>
                          <CategoryIcon name={iconName} className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-sans truncate w-full" title={cat}>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes input */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium font-sans">Ghi chú chi tiết</label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <textarea 
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder={activeTab === 0 ? "Uống cà phê / Ăn trưa..." : "Nhận lương / Thưởng tháng..."}
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-orange-500 text-xs text-white placeholder:text-neutral-600 font-sans"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-2.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                  activeTab === 0 
                    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black shadow-orange-500/10' 
                    : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black shadow-emerald-500/10'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Ghi nhận {activeTab === 0 ? 'chi tiêu' : 'thu nhập'}
              </button>
            </form>
          )}

          {/* TAB 3: LOAN FORM */}
          {activeTab === 2 && (
            <form onSubmit={handleLoanSubmit} className="space-y-4">
              {/* Person Name with Datalist suggestion */}
              <div className="space-y-1.5 font-sans">
                <label className="text-xs text-neutral-400 font-medium font-sans">
                  Người đi vay (Có gợi ý)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="text"
                    required
                    list="registered-people-list"
                    value={loanPerson}
                    onChange={(e) => setLoanPerson(e.target.value)}
                    placeholder="Chọn người có sẵn hoặc nhập mới..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs font-sans"
                    autoFocus
                  />
                  <datalist id="registered-people-list">
                    {people.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium font-sans">Số tiền cho vay ({currencySymbol})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-orange-500 font-mono">
                    {currencySymbol}
                  </span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    required
                    value={loanAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setLoanAmount)}
                    placeholder="0"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                {/* Click Suggested Amount Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" id="loan-amount-suggestions">
                  <span className="text-[10px] text-neutral-500 whitespace-nowrap mr-0.5">Gợi ý:</span>
                  {getDynamicSuggestions(loanAmount).map((sug) => (
                    <button
                      key={sug.value}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug.value, setLoanAmount)}
                      className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date setup */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center min-h-[20px] pb-0.5">
                    <label className="text-xs text-neutral-400 font-medium font-sans">Ngày vay</label>
                  </div>
                  <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl flex items-center px-2.5 py-2.5 focus-within:border-orange-500 transition-colors">
                    <span className="text-xs font-mono text-white select-none">
                      {renderFriendlyDate(loanDate) || 'Chọn ngày'}
                    </span>
                    <input 
                      type="date"
                      required
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center min-h-[20px] pb-0.5">
                    <label className="text-xs text-neutral-400 font-medium font-sans">Hạn trả (Chu kỳ)</label>
                  </div>
                  <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl flex items-center px-2.5 py-2.5 focus-within:border-orange-500 transition-colors">
                    <span className="text-xs font-mono text-white select-none">
                      {renderFriendlyDate(loanDueDate) || 'Chọn ngày'}
                    </span>
                    <input 
                      type="date"
                      value={loanDueDate}
                      onChange={(e) => setLoanDueDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>
                </div>
              </div>

              {/* Loan Note */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium font-sans">Mục đích vay / Ghi chú</label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <textarea 
                    value={loanNote}
                    onChange={(e) => setLoanNote(e.target.value)}
                    placeholder="Mục đích nợ hoặc lý do (Thu phí dịch vụ 15% trước)..."
                    rows={2}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-orange-500 text-xs text-white placeholder:text-neutral-600 font-sans"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black font-bold rounded-xl shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Ghi nhận khoản nợ mới
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
