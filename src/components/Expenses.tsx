/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, UserProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/dummyData';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  TrendingDown, 
  TrendingUp,
  Calendar,
  Layers,
  FileText,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { CategoryIcon, getCategoryIconName } from '../utils/icons';

interface ExpensesProps {
  type: 'expense' | 'income';
  transactions: Transaction[];
  profile: UserProfile;
  expenseCategories: string[];
  incomeCategories: string[];
  categoryIcons: Record<string, string>;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (id: string, updatedTx: { amount: number; category: string; date: string; note: string }) => void;
  onOpenQuickAdd: (type: 'expense' | 'income') => void;
}

export default function Expenses({ 
  type,
  transactions, 
  profile, 
  expenseCategories,
  incomeCategories,
  categoryIcons,
  onDeleteTransaction,
  onEditTransaction,
  onOpenQuickAdd 
}: ExpensesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Edit transaction states
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Categorize totals
  const totalAmount = transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);

  // Grouped by Category for visual progress ratios
  const categorySummary = transactions
    .filter(t => t.type === type)
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const maxCategoryAmount = Math.max(...Object.values(categorySummary), 1);

  // Filter processes
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = t.type === type;

    const matchesCategory = 
      selectedCategory === 'all' || 
      t.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  const handleOpenDeleteConfirm = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditAmount(tx.amount.toLocaleString('vi-VN'));
    setEditCategory(tx.category);
    setEditDate(tx.date);
    setEditNote(tx.note);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setEditAmount('');
    setEditCategory('');
    setEditDate('');
    setEditNote('');
    setEditError(null);
  };

  const handleSaveEdit = (id: string) => {
    const rawVal = editAmount.replace(/\D/g, '');
    const numVal = parseInt(rawVal, 10);
    if (isNaN(numVal) || numVal <= 0) {
      setEditError('Số tiền không hợp lệ!');
      return;
    }
    if (!editCategory) {
      setEditError('Vui lòng chọn danh mục!');
      return;
    }
    onEditTransaction(id, {
      amount: numVal,
      category: editCategory,
      date: editDate || new Date().toISOString().slice(0, 10),
      note: editNote
    });
    setEditingTxId(null);
    setEditError(null);
  };

  return (
    <div className="space-y-6" id={`ledger-container-${type}`}>
      {/* Mini Cashflow summary widgets */}
      <div className="grid grid-cols-1 animate-fade-in" id={`summary-card-${type}`}>
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${
          type === 'expense' ? 'bg-orange-500/5 border-orange-500/10' : 'bg-emerald-500/5 border-emerald-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              type === 'expense' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono text-neutral-500 font-semibold leading-none">
                {type === 'expense' ? 'Tổng tiền đã tiêu' : 'Tổng tiền đã thu'}
              </p>
              <p className="text-lg font-bold text-white font-display mt-1.5 leading-none">
                {formatCurrency(totalAmount, profile.currency)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenQuickAdd(type)}
            className={`p-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 leading-none active:scale-95 ${
              type === 'expense' 
                ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/10' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/10'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm {type === 'expense' ? 'khoản chi' : 'khoản thu'}
          </button>
        </div>
      </div>

      {/* Expense/Income categories progress chart */}
      {Object.keys(categorySummary).length > 0 && (
        <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 animate-fade-in" id="categories-analysis">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
            <Layers className={`w-4 h-4 ${type === 'expense' ? 'text-orange-500' : 'text-emerald-500'}`} /> Phân tích cơ cấu {type === 'expense' ? 'chi tiêu' : 'thu nhập'}
          </h3>
          <div className="space-y-3">
            {Object.entries(categorySummary)
              .sort((a, b) => b[1] - a[1]) // highest first
              .slice(0, 4) // Show top 4
              .map(([category, amount]) => {
                const ratio = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                return (
                  <div key={category} className="space-y-1.5">
                     <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300 font-medium">{category}</span>
                      <div className="space-x-1.5 font-mono">
                        <span className="text-neutral-400">({ratio.toFixed(0)}%)</span>
                        <span className={`${type === 'expense' ? 'text-orange-400' : 'text-emerald-400'} font-bold`}>
                          {formatCurrency(amount, profile.currency)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${type === 'expense' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filter Options panel */}
      <div className="space-y-3 animate-fade-in" id="filters-panel">
        <div className="flex gap-2" id="search-input-group">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text"
              placeholder="Tìm kiếm danh mục, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-600 font-sans"
            />
          </div>
        </div>

        {/* Action filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="filter-pills-row">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? (type === 'expense' ? 'bg-orange-500 text-black font-bold' : 'bg-emerald-500 text-black font-bold')
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Tất cả danh mục
          </button>

          <span className="h-4 w-px bg-neutral-800 flex-shrink-0" />

          {type === 'expense' && expenseCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold' 
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              #{cat}
            </button>
          ))}

          {type === 'income' && incomeCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' 
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              #{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main transactions scroll roster */}
      <div className="space-y-2 animate-fade-in" id="main-tx-ledger">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/10 border border-neutral-800/80 rounded-2xl space-y-2">
            <Filter className="w-8 h-8 mx-auto text-neutral-750" />
            <p className="text-sm text-neutral-500">Không tìm thấy giao dịch phù hợp.</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            if (editingTxId === tx.id) {
              return (
                <div 
                  key={tx.id} 
                  className="p-4 bg-neutral-900 border border-neutral-700 rounded-xl space-y-3 animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-neutral-300">Chỉnh sửa giao dịch</span>
                    {editError && <span className="text-[11px] text-red-400 font-medium">{editError}</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">Danh mục</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">Số tiền ({profile.currency})</label>
                      <input
                        type="text"
                        value={editAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val) {
                            setEditAmount(parseInt(val, 10).toLocaleString('vi-VN'));
                          } else {
                            setEditAmount('');
                          }
                        }}
                        placeholder="0"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">Ngày giao dịch</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">Ghi chú</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Nội dung giao dịch..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-neutral-850">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-750 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Hủy
                    </button>
                    <button
                      onClick={() => handleSaveEdit(tx.id)}
                      className="px-3 py-1.5 text-[11px] font-bold bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Lưu
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={tx.id} 
                className="group flex items-center justify-between p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/60 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                    tx.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    <CategoryIcon name={getCategoryIconName(tx.category, categoryIcons)} className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{tx.category}</span>
                    </div>
                    {tx.note && (
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                        <span className="line-clamp-1">{tx.note}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                      <span>{formatDate(tx.date)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-1.5">
                    <span className={`text-sm font-mono font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-orange-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                    </span>
                  </div>
                  
                  {/* Edit transaction button */}
                  <button 
                    onClick={() => handleStartEdit(tx)}
                    className="p-2 text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa giao dịch"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Trash delete button with Mini Confirmation Modal */}
                  <button 
                    onClick={() => handleOpenDeleteConfirm(tx)}
                    className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Xoá giao dịch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal overlay portal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa giao dịch"
        message={`Bạn có chắc chắn muốn xóa giao dịch "${transactionToDelete?.category}" - ${transactionToDelete ? formatCurrency(transactionToDelete.amount, profile.currency) : ''} chứ? Việc này sẽ ảnh hưởng trực tiếp đến tổng thu chi trong ngân quỹ của bạn.${transactionToDelete?.loanId ? ' Giao dịch này liên kết với một khoản vay, Nhật ký nợ tương ứng của khoản vay cũng sẽ tự động được xóa để giữ đồng bộ dữ liệu.' : ''}`}
      />
    </div>
  );
}
