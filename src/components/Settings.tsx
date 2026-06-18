/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  User, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  FolderOpen,
  Users2,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/dummyData';
import { CategoryIcon, getCategoryIconName, AVAILABLE_ICONS } from '../utils/icons';

interface SettingsProps {
  profile: UserProfile;
  expenseCategories: string[];
  onAddExpenseCategory: (cat: string, icon?: string) => void;
  onEditExpenseCategory: (oldCat: string, newCat: string, icon?: string) => void;
  onDeleteExpenseCategory: (cat: string) => void;
  incomeCategories: string[];
  onAddIncomeCategory: (cat: string, icon?: string) => void;
  onEditIncomeCategory: (oldCat: string, newCat: string, icon?: string) => void;
  onDeleteIncomeCategory: (cat: string) => void;
  categoryIcons: Record<string, string>;
  people: string[];
  onAddPerson: (person: string) => void;
  onEditPerson: (oldPerson: string, newPerson: string) => void;
  onDeletePerson: (person: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetToDefault: () => void;
  onClearAll: () => void;
  onExportData: () => string;
  onImportData: (jsonStr: string) => boolean;
  onManualSync: (latestProfile?: UserProfile) => void;
}

export default function Settings({ 
  profile, 
  expenseCategories,
  onAddExpenseCategory,
  onEditExpenseCategory,
  onDeleteExpenseCategory,
  incomeCategories,
  onAddIncomeCategory,
  onEditIncomeCategory,
  onDeleteIncomeCategory,
  categoryIcons,
  people,
  onAddPerson,
  onEditPerson,
  onDeletePerson,
  onUpdateProfile, 
  onResetToDefault, 
  onClearAll,
  onExportData,
  onImportData,
  onManualSync
}: SettingsProps) {
  // Helper formatting function: adds dot separators for thousands
  const formatNumberWithDots = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Main settings state
  const [name, setName] = useState(profile.name);
  const [monthlyBudget, setMonthlyBudget] = useState(formatNumberWithDots(profile.monthlyBudget.toString()));
  const [initialBalance, setInitialBalance] = useState(formatNumberWithDots((profile.initialBalance ?? 100000000).toString()));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // States for manual sync feed animation
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile data dynamically on resets/switches
  useEffect(() => {
    setName(profile.name);
    setMonthlyBudget(formatNumberWithDots(profile.monthlyBudget.toString()));
    setInitialBalance(formatNumberWithDots((profile.initialBalance ?? 100000000).toString()));
  }, [profile]);

  const handleExportClick = () => {
    try {
      const rawData = onExportData();
      const blob = new Blob([rawData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SOTUCHI_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Không thể xuất file sao lưu!');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportData(content);
      if (success) {
        alert('Nhập dữ liệu sao lưu thành công!');
      } else {
        alert('File sao lưu (.json) không đúng định dạng hoặc bị lỗi cấu trúc dữ liệu!');
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be imported again if needed
    e.target.value = '';
  };

  const handleManualSyncClick = () => {
    setSyncing(true);

    // Auto-parse inputs to capture values entered by user immediately before syncing
    const rawDigits = monthlyBudget.replace(/\D/g, '');
    const budgetNum = parseFloat(rawDigits) || 0;
    const rawBalanceDigits = initialBalance.replace(/\D/g, '');
    const balanceNum = parseFloat(rawBalanceDigits) || 0;

    const latestProfile: UserProfile = {
      name: name.trim() || 'Người dùng',
      currency: 'VND',
      monthlyBudget: budgetNum,
      initialBalance: balanceNum
    };

    onUpdateProfile(latestProfile);
    onManualSync(latestProfile);

    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    }, 850);
  };

  // Sub-tab selection for lists management: 'expenses' | 'incomes' | 'people'
  const [activeManagerTab, setActiveManagerTab] = useState<'expenses' | 'incomes' | 'people'>('expenses');

  // Input state for adding new items
  const [newItemInput, setNewItemInput] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState('HelpCircle');

  // Editing state for existing items
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingItemIcon, setEditingItemIcon] = useState('HelpCircle');

  // Confirmation Modal states
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    type: 'delete_expense_cat' | 'delete_income_cat' | 'delete_person';
    value: string;
    message: string;
  }>({
    isOpen: false,
    type: 'delete_expense_cat',
    value: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = monthlyBudget.replace(/\D/g, '');
    const budgetNum = parseFloat(rawDigits);
    if (isNaN(budgetNum) || budgetNum < 0) {
      alert('Hạn mức ngân sách phải là một số lớn hơn hoặc bằng 0!');
      return;
    }

    const rawBalanceDigits = initialBalance.replace(/\D/g, '');
    const balanceNum = parseFloat(rawBalanceDigits);
    if (isNaN(balanceNum) || balanceNum < 0) {
      alert('Số dư tiền mặt ban đầu phải là một số lớn hơn hoặc bằng 0!');
      return;
    }

    onUpdateProfile({
      name: name.trim() || 'Người dùng',
      currency: 'VND', // Always Vietnamese Dong
      monthlyBudget: budgetNum,
      initialBalance: balanceNum
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Trigger handlers for adding new items to dynamic states
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemInput.trim();
    if (!trimmed) return;

    if (activeManagerTab === 'expenses') {
      onAddExpenseCategory(trimmed, selectedNewIcon);
    } else if (activeManagerTab === 'incomes') {
      onAddIncomeCategory(trimmed, selectedNewIcon);
    } else {
      onAddPerson(trimmed);
    }
    setNewItemInput('');
    setSelectedNewIcon('HelpCircle');
  };

  // Trigger editing item
  const startEditing = (idx: number, currentText: string) => {
    setEditingItemIndex(idx);
    setEditingItemText(currentText);
    setEditingItemIcon(categoryIcons[currentText] || getCategoryIconName(currentText, categoryIcons));
  };

  const cancelEditing = () => {
    setEditingItemIndex(null);
    setEditingItemText('');
  };

  const saveEditing = (oldValue: string) => {
    const newValue = editingItemText.trim();
    if (!newValue) {
      cancelEditing();
      return;
    }

    if (activeManagerTab === 'expenses') {
      onEditExpenseCategory(oldValue, newValue, editingItemIcon);
    } else if (activeManagerTab === 'incomes') {
      onEditIncomeCategory(oldValue, newValue, editingItemIcon);
    } else {
      onEditPerson(oldValue, newValue);
    }
    cancelEditing();
  };

  // Trigger delete with modal confirmation
  const triggerDeleteConfirm = (value: string, type: 'delete_expense_cat' | 'delete_income_cat' | 'delete_person') => {
    let message = '';
    if (type === 'delete_expense_cat') {
      message = `Bạn có chắc chắn muốn xóa danh mục chi tiêu "${value}"? Giao dịch liên quan sẽ tự động được chuyển sang danh mục chi tiêu khác còn lại.`;
    } else if (type === 'delete_income_cat') {
      message = `Bạn có chắc chắn muốn xóa danh mục thu nhập "${value}"? Giao dịch liên quan sẽ tự động được chuyển sang danh mục thu nhập khác còn lại.`;
    } else {
      message = `Bạn có chắc chắn muốn xóa "${value}" khỏi danh bạ đối tác nợ? Các khoản ghi chú nợ vay cũ liên quan sẽ được giữa nguyên danh tính để lưu giữ làm dữ liệu lịch sử.`;
    }

    setConfirmModalConfig({
      isOpen: true,
      type,
      value,
      message
    });
  };

  const handleExecuteDelete = () => {
    const { type, value } = confirmModalConfig;
    if (type === 'delete_expense_cat') {
      onDeleteExpenseCategory(value);
    } else if (type === 'delete_income_cat') {
      onDeleteIncomeCategory(value);
    } else {
      onDeletePerson(value);
    }
    setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Pick current array based on current manager tab choice
  const getCurrentList = () => {
    if (activeManagerTab === 'expenses') return expenseCategories;
    if (activeManagerTab === 'incomes') return incomeCategories;
    return people;
  };

  const currentList = getCurrentList();

  return (
    <div className="space-y-6 pb-26 font-sans" id="settings-view-container">
      {/* View Header */}
      <div id="settings-header">
        <h1 className="text-2xl font-display font-bold text-white">Cài Đặt Hệ Thống</h1>
        <p className="text-neutral-400 text-sm">Cá nhân hóa tài khoản & quản trị cơ sở dữ liệu</p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4" id="profile-settings-form">
        <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
          <User className="w-4 h-4" /> cấu hình chung
        </h3>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300">Biệt danh hiển thị</label>
          <input 
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Nhập tên..."
          />
        </div>

        {/* Initial Balance input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300 font-sans">Thiết lập tiền mặt hiện có (Tài sản khả dụng ban đầu)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
              đ
            </span>
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(formatNumberWithDots(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Budget input with visual indicators */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300 font-sans">Ngân sách dự phòng hàng tháng</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
              đ
            </span>
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              required
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(formatNumberWithDots(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4 stroke-[2.5px]" /> {savedSuccess ? 'Cấu hình thành công!' : 'Áp dụng cài đặt'}
        </button>
      </form>

      {/* DYNAMIC LISTS MANAGER - Requested strictly by user: Thêm Sửa Xoá Danh mục + Danh sách Người Vay */}
      <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4" id="dynamic-lists-manager">
        <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4" /> quản lý danh mục & danh bạ
        </h3>

        {/* Sub navigation switchers */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[10px]" id="lists-subtabs">
          <button
            onClick={() => { setActiveManagerTab('expenses'); cancelEditing(); }}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
              activeManagerTab === 'expenses' 
                ? 'bg-neutral-900 text-orange-400 font-bold' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            🔴 DM Chi tiêu
          </button>
          <button
            onClick={() => { setActiveManagerTab('incomes'); cancelEditing(); }}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
              activeManagerTab === 'incomes' 
                ? 'bg-neutral-900 text-emerald-400 font-bold' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            🟢 DM Thu nhập
          </button>
          <button
            onClick={() => { setActiveManagerTab('people'); cancelEditing(); }}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
              activeManagerTab === 'people' 
                ? 'bg-neutral-900 text-amber-500 font-bold' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            👥 Người Vay
          </button>
        </div>

        {/* Adding form tool */}
        <form onSubmit={handleAddNewItem} className="space-y-3">
          <div className="flex gap-2">
            <input 
              type="text"
              required
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              placeholder={
                activeManagerTab === 'expenses'
                  ? 'Thêm danh mục chi mới (ví dụ: Mua sắm...)'
                  : activeManagerTab === 'incomes'
                  ? 'Thêm danh mục thu mới (ví dụ: Đầu tư...)'
                  : 'Ghi danh người vay mới (Anh Nam, Chị Vy...)'
              }
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            {activeManagerTab !== 'people' && (
              <select
                value={selectedNewIcon}
                onChange={(e) => setSelectedNewIcon(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                title="Chọn Icon"
              >
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic.name} value={ic.name}>
                    {ic.emoji} {ic.label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-650 active:scale-95 text-black font-bold transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
              title="Thêm"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
          
          {/* Quick interactive icon tap bar */}
          {activeManagerTab !== 'people' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none bg-black/20 p-2 rounded-xl border border-neutral-800/30">
              <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap pr-1">Chọn Icon nhanh:</span>
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setSelectedNewIcon(ic.name)}
                  className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    selectedNewIcon === ic.name
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold scale-105'
                      : 'bg-neutral-900/60 border border-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={ic.label}
                >
                  <span className="text-sm">{ic.emoji}</span>
                  <span className="text-[10px]">{ic.label}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Items scroll list */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[320px] overflow-y-auto pr-1" id="manager-items-list">
          {currentList.length === 0 ? (
            <p className="col-span-full text-center py-6 text-neutral-600 italic text-xs">Danh mục rỗng.</p>
          ) : (
            currentList.map((item, idx) => {
              const isEditing = editingItemIndex === idx;
              const isProtectedCategory = (activeManagerTab !== 'people') && (currentList.length <= 1); // protect the very last category from deletion to prevent empty list

              return (
                <div 
                  key={`${item}-${idx}`}
                  className={`flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/50 hover:border-neutral-800 text-xs gap-2 transition-all duration-300 ${
                    isEditing ? 'col-span-full ring-1 ring-orange-500/30 bg-neutral-950 shadow-md shadow-orange-500/5' : ''
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-2 p-1">
                      <input 
                        type="text"
                        required
                        value={editingItemText}
                        onChange={(e) => setEditingItemText(e.target.value)}
                        className="w-full bg-neutral-900 border border-orange-500/55 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      {activeManagerTab !== 'people' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">Chọn Icon:</span>
                          <select
                            value={editingItemIcon}
                            onChange={(e) => setEditingItemIcon(e.target.value)}
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            {AVAILABLE_ICONS.map(ic => (
                              <option key={ic.name} value={ic.name}>
                                {ic.emoji} {ic.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex justify-end gap-1.5 mt-1">
                        <button
                          onClick={() => saveEditing(item)}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-0.5"
                          title="Lưu"
                        >
                          <Check className="w-3 h-3" /> Lưu
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer flex items-center gap-0.5"
                          title="Hủy"
                        >
                          <X className="w-3 h-3" /> Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        {activeManagerTab !== 'people' && (
                          <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800/40 flex items-center justify-center shrink-0">
                            <CategoryIcon 
                              name={getCategoryIconName(item, categoryIcons)} 
                              className={`w-3.5 h-3.5 ${
                                activeManagerTab === 'expenses' ? 'text-red-400' : 'text-emerald-400'
                              }`} 
                            />
                          </div>
                        )}
                        <span className="font-semibold text-neutral-200 truncate" title={item}>
                          {item}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit Button */}
                        <button
                          onClick={() => startEditing(idx, item)}
                          className="p-0.5 text-neutral-500 hover:text-orange-400 hover:bg-neutral-900 rounded transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        {!isProtectedCategory ? (
                          <button
                            onClick={() => {
                              const deleteType = 
                                activeManagerTab === 'expenses' 
                                  ? 'delete_expense_cat' 
                                  : activeManagerTab === 'incomes' 
                                  ? 'delete_income_cat' 
                                  : 'delete_person';
                              triggerDeleteConfirm(item, deleteType);
                            }}
                            className="p-0.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-neutral-650 px-1 py-0.5 border border-neutral-900/60 rounded select-none uppercase" title="Cần có ít nhất một danh mục trong hệ thống">Duy nhất</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backup, Restore & Sync system data panel */}
      <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4" id="database-actions">
        <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4" /> Sao lưu & khôi phục dữ liệu
        </h3>

        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
          Bạn có thể xuất toàn bộ hồ sơ chi tiêu, sổ vay và tài khoản cá nhân hiện có ra file (.json) để lưu trữ dự phòng, hoặc khôi phục lại dữ liệu bất kỳ lúc nào.
        </p>

        {/* Hidden file input for recovery */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        <div className="grid grid-cols-2 gap-2">
          {/* Download backup */}
          <button
            type="button"
            onClick={handleExportClick}
            className="py-2.5 bg-neutral-950 hover:bg-neutral-900 active:scale-95 text-xs text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-orange-500" /> Xuất file sao lưu
          </button>

          {/* Import backup */}
          <button
            type="button"
            onClick={handleImportClick}
            className="py-2.5 bg-neutral-950 hover:bg-neutral-900 active:scale-95 text-xs text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-orange-500" /> Nhập từ file sao lưu
          </button>
        </div>

        {/* Manual Sync Button & indicator */}
        <div className="border-t border-neutral-800/60 pt-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-500 font-mono">DỮ LIỆU ĐƯỢC TỰ ĐỘNG LƯU TRỮ CỤC BỘ</span>
            {syncSuccess && (
              <span className="text-[10px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                <Check className="w-3 h-3" /> Đồng bộ hệ thống thành công!
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={syncing}
            onClick={handleManualSyncClick}
            className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              syncing 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-500' 
                : 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40 text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Đang kiểm tra & đồng bộ...' : 'Đồng bộ dữ liệu thủ công'}
          </button>
        </div>

        {/* Default / Reset utilities secondary zone */}
        <div className="border-t border-neutral-800/60 pt-3 space-y-2">
          <span className="text-[10px] text-neutral-500 font-mono block">CÁC THAO TÁC CƠ SỞ DỮ LIỆU KHÁC</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Khôi phục sẽ nạp lại dữ liệu thu chi & vay nợ mẫu để trải nghiệm thử. Hoạt động này sẽ ghi đè lên dữ liệu hiện tại của bạn. Đồng ý?')) {
                  onResetToDefault();
                }
              }}
              className="flex-1 py-1.5 bg-neutral-950 text-[10px] text-neutral-400 hover:text-white border border-neutral-800/60 hover:border-neutral-700 rounded-lg transition-all cursor-pointer"
            >
              Cài lại dữ liệu mẫu
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn toàn bộ các khoản giao dịch chi tiêu, hóa đơn, và các khoản nợ vay mà không thể khôi phục. Bạn đã chắc chắn?')) {
                  onClearAll();
                }
              }}
              className="flex-1 py-1.5 bg-red-950/10 text-[10px] text-red-400 hover:text-red-300 border border-red-950/25 hover:border-red-950/50 rounded-lg transition-all cursor-pointer"
            >
              Xóa sạch dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* Mini Confirmation Modal overlay portal for deleting lists */}
      <ConfirmationModal 
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title="Xác nhận xóa danh mục"
        message={confirmModalConfig.message}
      />
    </div>
  );
}
