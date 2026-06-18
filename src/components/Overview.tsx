/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Loan, UserProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/dummyData';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  HandHeart, 
  HandCoins,
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  BellRing,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { CategoryIcon, getCategoryIconName } from '../utils/icons';

interface OverviewProps {
  transactions: Transaction[];
  loans: Loan[];
  profile: UserProfile;
  categoryIcons: Record<string, string>;
  onNavigate: (tab: 'expenses' | 'loans') => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function Overview({ transactions, loans, profile, categoryIcons, onNavigate, onUpdateProfile }: OverviewProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editBalanceVal, setEditBalanceVal] = useState('');

  // Overdue calculation helper
  const calculateOverduePenalty = (l: Loan) => {
    if (l.status === 'paid' || !l.dueDate) {
      return { daysOverdue: 0, penaltyAmount: 0 };
    }
    const due = new Date(l.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    if (daysOverdue <= 0) {
      return { daysOverdue: 0, penaltyAmount: 0 };
    }

    const rate = Math.min(daysOverdue * 0.001, 0.30);
    const penaltyAmount = Math.ceil(l.amount * rate);

    return { daysOverdue, penaltyAmount };
  };

  // 1. Calculate Core Financial Metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Real principal disbursements/receipts for lending loans
  const lentPrincipalDisbursed = loans
    .filter(l => l.type === 'lend')
    .reduce((sum, l) => sum + l.amount, 0);

  // Net Balance correctly adjusted for loan principals to prevent double counting
  const cashOnHand = (profile.initialBalance ?? 100000000) + totalIncome - totalExpense - lentPrincipalDisbursed;

  const formatNumberWithDots = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleSaveBalance = () => {
    const rawDigits = editBalanceVal.replace(/\D/g, '');
    const targetBalance = parseFloat(rawDigits);
    if (!isNaN(targetBalance) && targetBalance >= 0) {
      const nextInitialBalance = Math.max(0, targetBalance - totalIncome + totalExpense + lentPrincipalDisbursed);
      onUpdateProfile({
        ...profile,
        initialBalance: nextInitialBalance
      });
    }
    setIsEditingBalance(false);
  };

  // Active Lent (Số tiền mình đã cho người khác vay mà CHƯA THU HỒI)
  const activeLentOutstanding = loans
    .filter(l => l.type === 'lend' && l.status === 'active')
    .reduce((sum, l) => sum + (l.amount - l.paidAmount), 0);

  const totalLentAmountActive = loans
    .filter(l => l.type === 'lend' && l.status === 'active')
    .reduce((sum, l) => sum + l.amount, 0);

  // --- Dynamic Fee, Penalty and Extension calculations ---

  // A. 15% Upfront Service Fee Collected - Deactivated as requested (always 0)
  const totalUpfrontFeesCollected = 0;

  // B. Extension Fees (Gia hạn) - Only after 2026-06-18
  let totalExtensionsCollected = 0;
  loans.forEach(l => {
    const extAmount = l.repayments
      .filter(r => (r.isExtension || r.note?.toLowerCase().includes('gia hạn') || r.note?.toLowerCase().includes('phí gia hạn')) && new Date(r.date) >= new Date('2026-06-18'))
      .reduce((sum, r) => sum + (r.feeAmount !== undefined ? r.feeAmount : r.amount - (r.penaltyAmount || 0)), 0);
    
    if (l.type === 'lend') {
      totalExtensionsCollected += extAmount;
    }
  });

  const extTxCollected = transactions
    .filter(t => t.type === 'income' && (t.note?.toLowerCase().includes('phí gia hạn') || t.note?.toLowerCase().includes('thu phí gia hạn')) && new Date(t.date) >= new Date('2026-06-18'))
    .reduce((sum, t) => sum + t.amount, 0);

  totalExtensionsCollected = Math.max(totalExtensionsCollected, extTxCollected);

  // C. Phí dịch vụ giảm gốc (15% dư nợ gốc khi trả một phần) - Only after 2026-06-18 (tên cũ: Phí duy trì)
  let totalMaintenanceFeesCollected = 0;
  loans.forEach(l => {
    const maintAmount = l.repayments
      .filter(r => !r.isExtension && !r.note?.toLowerCase().includes('gia hạn') && (r.feeAmount !== undefined || r.note?.toLowerCase().includes('phí duy trì') || r.note?.toLowerCase().includes('duy trì 15%') || r.note?.toLowerCase().includes('giảm gốc') || r.note?.toLowerCase().includes('phí giảm gốc')) && new Date(r.date) >= new Date('2026-06-18'))
      .reduce((sum, r) => {
        if (r.feeAmount !== undefined) return sum + r.feeAmount;
        const match = r.note?.toLowerCase().match(/còn lại ([\d\.]+)\s*(?:đ|vnd)/i) || r.note?.toLowerCase().match(/trì ([\d\.]+)\s*(?:đ|vnd)/i) || r.note?.toLowerCase().match(/gốc ([\d\.]+)\s*(?:đ|vnd)/i) || r.note?.toLowerCase().match(/giảm ([\d\.]+)\s*(?:đ|vnd)/i);
        if (match) {
          const parsed = parseInt(match[1].replace(/\./g, ''), 10);
          return sum + (isNaN(parsed) ? 150000 : parsed);
        }
        return sum;
      }, 0);

    if (l.type === 'lend') {
      totalMaintenanceFeesCollected += maintAmount;
    }
  });

  const maintTxCollected = transactions
    .filter(t => t.type === 'income' && (t.note?.toLowerCase().includes('phí duy trì') || t.note?.toLowerCase().includes('phí giảm gốc') || t.note?.toLowerCase().includes('gốc')) && new Date(t.date) >= new Date('2026-06-18'))
    .reduce((sum, t) => {
      const match = t.note?.toLowerCase().match(/còn lại ([\d\.]+)\s*(?:đ|vnd)/i) || t.note?.toLowerCase().match(/trì ([\d\.]+)\s*(?:đ|vnd)/i) || t.note?.toLowerCase().match(/gốc ([\d\.]+)\s*(?:đ|vnd)/i) || t.note?.toLowerCase().match(/giảm ([\d\.]+)\s*(?:đ|vnd)/i);
      if (match) {
        const parsed = parseInt(match[1].replace(/\./g, ''), 10);
        return sum + (isNaN(parsed) ? 0 : parsed);
      }
      return sum;
    }, 0);

  totalMaintenanceFeesCollected = Math.max(totalMaintenanceFeesCollected, maintTxCollected);

  // D. Penalties Collected/Paid from Overdue settles (excess over original amount or explicitly tracked)
  let totalPenaltiesCollected = 0;
  loans.forEach(l => {
    // 1. Explicit penaltyAmount fields
    const explicitPenaltySum = l.repayments
      .reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);

    // 2. Excess of non-extension repayments over l.amount (excess principal indicating penalty was paid)
    const nonExtRepsAmount = l.repayments
      .filter(r => !r.isExtension && !r.note?.toLowerCase().includes('gia hạn') && !r.note?.toLowerCase().includes('phí duy trì'))
      .reduce((sum, r) => sum + r.amount, 0);
    
    let excessPenalty = 0;
    if (nonExtRepsAmount > l.amount) {
      excessPenalty = nonExtRepsAmount - l.amount;
    }

    // 3. Highlight keywords in non-explicit records
    let textPenalty = 0;
    l.repayments.forEach(r => {
      if (!r.penaltyAmount && (r.note?.toLowerCase().includes('phạt') || r.note?.toLowerCase().includes('trễ hạn'))) {
        textPenalty += r.amount;
      }
    });

    const finalLoanPenalty = Math.max(explicitPenaltySum, excessPenalty, textPenalty);

    if (l.type === 'lend') {
      totalPenaltiesCollected += finalLoanPenalty;
    }
  });

  const penaltyTxCollected = transactions
    .filter(t => t.type === 'income' && (t.note?.toLowerCase().includes('tiền phạt') || t.note?.toLowerCase().includes('phạt trễ hạn') || t.note?.toLowerCase().includes('phí phạt')))
    .reduce((sum, t) => sum + t.amount, 0);

  totalPenaltiesCollected = Math.max(totalPenaltiesCollected, penaltyTxCollected);

  // E. Pending/Accrueing Penalties on active overdue loans
  const estimatedLentPenaltiesAccrued = loans
    .filter(l => l.type === 'lend' && l.status === 'active')
    .reduce((sum, l) => sum + calculateOverduePenalty(l).penaltyAmount, 0);

  // Monthly Budget Progress
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "2026-06"
  const thisMonthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetProgress = profile.monthlyBudget > 0 
    ? (thisMonthExpenses / profile.monthlyBudget) * 100 
    : 0;

  // 2. Identify urgent/upcoming loans
  const urgentLoans = loans
    .filter(l => l.status === 'active')
    .map(l => {
      const daysDiff = l.dueDate ? Math.ceil((new Date(l.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
      return { ...l, daysRemaining: daysDiff };
    })
    .filter(l => l.daysRemaining <= 7) // Due within 7 days or overdue
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="space-y-6 pb-24" id="overview-container">
      {/* Welcome header with profile info */}
      <div className="flex justify-between items-center" id="overview-header">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white">
            Xin chào, <span className="text-orange-500">{profile.name}</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Hôm nay của bạn thế nào?</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-mono text-neutral-300">
            {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* Main Wallet Box */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800/80 rounded-3xl p-6 shadow-2xl shadow-orange-500/5" id="wallet-card">
        {/* Amber glowing background accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-mono tracking-wider text-neutral-500 uppercase">Tài sản khả dụng (Tùy chỉnh)</p>
            {isEditingBalance ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.]*"
                  value={editBalanceVal}
                  onChange={(e) => setEditBalanceVal(formatNumberWithDots(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBalance()}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-base text-white font-mono focus:outline-none focus:border-orange-500 w-48"
                  autoFocus
                  placeholder="Nhập số tiền..."
                />
                <button 
                  onClick={handleSaveBalance}
                  className="p-2 rounded-lg bg-orange-500 text-black hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Lưu số dư"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                </button>
                <button 
                  onClick={() => setIsEditingBalance(false)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Hủy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1.5">
                <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                  {formatCurrency(cashOnHand, profile.currency)}
                </h2>
                <button
                  onClick={() => {
                    setEditBalanceVal(formatNumberWithDots(cashOnHand.toString()));
                    setIsEditingBalance(true);
                  }}
                  className="p-1.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-orange-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title="Thiết lập số dư hiện tại"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick horizontal divider */}
        <div className="h-px bg-neutral-800/80 my-5" />

        {/* Dynamic breakdown block */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-mono">TỔNG THU NHẬP</p>
            </div>
            <p className="text-lg font-semibold text-emerald-400 font-display">
              {formatCurrency(totalIncome, profile.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <p className="text-xs font-mono">TỔNG CHI TIÊU</p>
            </div>
            <p className="text-lg font-semibold text-orange-400 font-display">
              {formatCurrency(totalExpense, profile.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Loan Summary Grid: Lent Outstandings */}
      <div id="loans-mini-grid">
        <button 
          onClick={() => onNavigate('loans')}
          className="w-full flex items-center justify-between p-5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/70 hover:border-orange-500/35 transition-all rounded-3xl text-left relative overflow-hidden group"
          id="btn-goto-lend"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors rounded-2xl flex items-center justify-center">
              <HandHeart className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-mono uppercase mb-0.5">Tổng gốc cho vay (Dư nợ còn lại)</p>
              <p className="text-xl font-bold text-white tracking-tight">
                {formatCurrency(activeLentOutstanding, profile.currency)}
              </p>
            </div>
          </div>
          <p className="text-xs text-orange-500/85 flex items-center gap-1 font-semibold bg-orange-500/5 px-3 py-1.5 rounded-xl border border-orange-500/10 group-hover:bg-orange-500/10 transition-all">
            Quản lý hồ sơ vay <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </button>
      </div>

      {/* Fees & Penalties Performance Report */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-5 space-y-4" id="fees-penalties-report-card">
        <div className="flex justify-between items-center" id="report-card-header">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5 animate-pulse">
              📊 THỐNG KÊ LỢI NHUẬN
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Tổng hợp phí dịch vụ và phạt quá hạn từ các hồ sơ</p>
          </div>
        </div>

        <div id="report-grid">
          {/* LỢI TỨC THU VỀ (Cho vay) */}
          <div className="bg-neutral-950/40 p-4 border border-neutral-800/80 rounded-2xl space-y-3.5 w-full" id="earned-group">
            <h4 className="text-[11px] font-mono font-bold uppercase text-emerald-400 border-b border-neutral-800/60 pb-1.5 flex items-center justify-between">
              <span>Phí phát sinh từ Cho Vay (NDV Money)</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase font-sans font-semibold">ĐÃ THU</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Phí giải ngân (15%):</span>
                <span className="font-mono font-bold text-neutral-200">{formatCurrency(totalUpfrontFeesCollected, profile.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Phí gia hạn (15%):</span>
                <span className="font-mono font-bold text-neutral-200">{formatCurrency(totalExtensionsCollected, profile.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Phí giảm gốc (15%):</span>
                <span className="font-mono font-bold text-neutral-200">{formatCurrency(totalMaintenanceFeesCollected, profile.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Phí phạt quá hạn (0.1%/ngày):</span>
                <span className="font-mono font-bold text-neutral-200">{formatCurrency(totalPenaltiesCollected, profile.currency)}</span>
              </div>
              <div className="h-px bg-neutral-800/80 my-1" />
              <div className="flex justify-between items-center font-semibold text-emerald-400 text-sm">
                <span>Tổng lợi nhuận:</span>
                <span className="font-mono font-bold">{formatCurrency(totalUpfrontFeesCollected + totalExtensionsCollected + totalMaintenanceFeesCollected + totalPenaltiesCollected, profile.currency)}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-neutral-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 flex items-center gap-1">⏱️ Phạt tích lũy chưa thu:</span>
                  <span className="font-mono font-bold text-orange-400">{formatCurrency(estimatedLentPenaltiesAccrued, profile.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Alert */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 space-y-3" id="budget-progress-block">
        <div className="flex justify-between items-center text-xs">
          <span className="text-neutral-400 font-medium">Ngân sách chi tiêu tháng 6</span>
          <span className="text-white font-mono font-semibold">
            {formatCurrency(thisMonthExpenses, profile.currency)} / {formatCurrency(profile.monthlyBudget, profile.currency)}
          </span>
        </div>
        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              budgetProgress > 100 
                ? 'bg-red-500' 
                : budgetProgress > 80 
                ? 'bg-amber-500' 
                : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-neutral-500">
          <span>Tiến độ: {budgetProgress.toFixed(1)}%</span>
          <span>
            {budgetProgress > 100 
              ? '⚠️ Vượt hạn mức ngân sách!' 
              : `Còn lại ${formatCurrency(Math.max(0, profile.monthlyBudget - thisMonthExpenses), profile.currency)}`}
          </span>
        </div>
      </div>

      {/* Urgent Overdue or Looming Due Dates */}
      {urgentLoans.length > 0 && (
        <div className="space-y-2.5" id="urgent-loans-warning">
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Nhắc nhở khoản nợ đến hạn</h3>
          </div>
          
          <div className="space-y-2">
            {urgentLoans.map(loan => {
              const outstanding = loan.amount - loan.paidAmount;
              const isOverdue = loan.daysRemaining < 0;
              return (
                <div 
                  key={loan.id} 
                  className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    isOverdue 
                      ? 'bg-red-950/20 border-red-500/20 text-red-100' 
                      : 'bg-amber-950/10 border-amber-500/25 text-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isOverdue ? (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {loan.type === 'lend' ? 'Thu hồi từ:' : 'Trả cho:'} <span className="text-orange-400">{loan.person}</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 max-w-[200px] truncate">
                        {loan.note || 'Không có ghi chú'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-white">
                      {formatCurrency(outstanding, profile.currency)}
                    </p>
                    <p className={`text-[10px] font-semibold font-mono mt-0.5 uppercase ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                      {isOverdue 
                        ? `Quá hạn ${Math.abs(loan.daysRemaining)} ngày` 
                        : loan.daysRemaining === 0 
                        ? 'Hôm nay đến hạn' 
                        : `Còn ${loan.daysRemaining} ngày`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Mini Feed */}
      <div className="space-y-3" id="recent-activities">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Giao dịch gần đây</h3>
          <button 
            onClick={() => onNavigate('expenses')}
            className="text-xs text-orange-500 hover:text-orange-400 transition-colors font-semibold"
            id="btn-goto-all-tx"
          >
            Tất cả giao dịch →
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 bg-neutral-900/20 border border-neutral-800/80 rounded-2xl" id="no-tx-placeholder">
            <p className="text-sm text-neutral-500">Chưa có giao dịch nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="space-y-2" id="recent-tx-list">
            {transactions.slice(0, 4).map(tx => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/70 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center ${
                    tx.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    <CategoryIcon name={getCategoryIconName(tx.category, categoryIcons)} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">{tx.category}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{tx.note || 'Không ghi chú'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                  </span>
                  <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
                    {formatDate(tx.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
