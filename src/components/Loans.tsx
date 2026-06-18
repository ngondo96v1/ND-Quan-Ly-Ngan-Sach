/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Loan, UserProfile, Repayment, LoanType } from '../types';
import { formatCurrency, formatDate } from '../utils/dummyData';
import ConfirmationModal from './ConfirmationModal';
import EditLoanModal from './EditLoanModal';
import { 
  HandHeart, 
  HandCoins, 
  Trash2, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  History,
  Check,
  Pencil,
  AlertTriangle,
  X
} from 'lucide-react';

interface LoansProps {
  loans: Loan[];
  profile: UserProfile;
  onAddRepayment: (loanId: string, amount: number, note: string, isExtension?: boolean, principalAmount?: number, feeAmount?: number, penaltyAmount?: number) => void;
  onEditRepayment: (loanId: string, repaymentId: string, newAmount: number, newNote: string) => void;
  onDeleteRepayment: (loanId: string, repaymentId: string) => void;
  onToggleStatus: (loanId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  onEditLoan: (updatedLoan: Loan) => void;
  onOpenQuickAdd: () => void;
  people: string[];
}

export default function Loans({ 
  loans, 
  profile, 
  onAddRepayment, 
  onEditRepayment,
  onDeleteRepayment,
  onToggleStatus, 
  onDeleteLoan,
  onEditLoan,
  onOpenQuickAdd,
  people
}: LoansProps) {
  // Navigation tabs for loans view
  const [activeStatusTab, setActiveStatusTab] = useState<'active' | 'paid' | 'all'>('active');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  // Selected payment options state per expanded loan (1 = full, 2 = 15% outstanding, 3 = extension)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<1 | 2 | 3>(1);

  // Custom typed amounts for partial repayments
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Helper formatting function: adds dot separators for thousands
  const formatNumberWithDots = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (loanId: string, valRaw: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [loanId]: formatNumberWithDots(valRaw)
    }));
  };

  // Edit Loan modal state
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Inline confirmation states (Replacing full screen modal overlays)
  const [confirmingDeleteLoanId, setConfirmingDeleteLoanId] = useState<string | null>(null);
  const [confirmingDeleteRepId, setConfirmingDeleteRepId] = useState<string | null>(null);

  // Edit Repayment state
  const [editingRepaymentId, setEditingRepaymentId] = useState<string | null>(null);
  const [editRepAmount, setEditRepAmount] = useState<string>('');
  const [editRepNote, setEditRepNote] = useState<string>('');
  const [repaymentError, setRepaymentError] = useState<string | null>(null);
  const [paymentSubmitError, setPaymentSubmitError] = useState<string | null>(null);

  // Clear errors and states when selection or option changes
  useEffect(() => {
    setPaymentSubmitError(null);
    setRepaymentError(null);

    if (expandedLoanId) {
      const loan = loans.find(l => l.id === expandedLoanId);
      if (loan) {
        const outstanding = loan.amount - loan.paidAmount;
        if (outstanding <= 1000000 && selectedPaymentOption === 2) {
          setSelectedPaymentOption(1);
        }
      }
    }
  }, [expandedLoanId, selectedPaymentOption, loans]);

  const handleStartEditRepayment = (rep: Repayment) => {
    setEditingRepaymentId(rep.id);
    setEditRepAmount(formatNumberWithDots(rep.amount.toString()));
    setEditRepNote(rep.note);
    setRepaymentError(null);
  };

  const handleSaveRepayment = (loanId: string, repaymentId: string) => {
    const rawDigits = editRepAmount.replace(/\D/g, '');
    const numAmt = parseFloat(rawDigits);
    if (isNaN(numAmt) || numAmt <= 0) {
      setRepaymentError('Số tiền thanh toán không hợp lệ!');
      return;
    }
    onEditRepayment(loanId, repaymentId, numAmt, editRepNote);
    setEditingRepaymentId(null);
    setRepaymentError(null);
  };

  const handleCancelEditRepayment = () => {
    setEditingRepaymentId(null);
    setEditRepAmount('');
    setEditRepNote('');
    setRepaymentError(null);
  };

  // Helper penalty formula: Phí phạt trễ hạn = nợ gốc x0.1%/ngày (trần tối đa 30%)
  const calculateOverduePenalty = (l: Loan) => {
    if (l.status === 'paid' || !l.dueDate) {
      return { daysOverdue: 0, penaltyAmount: 0, penaltyRate: 0 };
    }
    const due = new Date(l.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    if (daysOverdue <= 0) {
      return { daysOverdue: 0, penaltyAmount: 0, penaltyRate: 0 };
    }

    const rate = Math.min(daysOverdue * 0.001, 0.30);
    const penaltyAmount = Math.ceil(l.amount * rate);

    return {
      daysOverdue,
      penaltyAmount,
      penaltyRate: rate
    };
  };

  // Quick stats calculations
  const totalLentActive = loans
    .filter(l => l.type === 'lend' && l.status === 'active')
    .reduce((sum, l) => sum + (l.amount - l.paidAmount), 0);

  const totalLentAmountActive = loans
    .filter(l => l.type === 'lend' && l.status === 'active')
    .reduce((sum, l) => sum + l.amount, 0);

  // Filter calculations
  const filteredLoans = loans.filter(l => {
    const matchesType = l.type === 'lend';
    const matchesStatus = activeStatusTab === 'all' || l.status === activeStatusTab;
    return matchesType && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handles contextual payments for Option 1, Option 2, and Option 3
  const handleDynamicPaymentSubmit = (loan: Loan, option: number) => {
    const { penaltyAmount } = calculateOverduePenalty(loan);
    const outstanding = loan.amount - loan.paidAmount;

    if (option === 1) {
      const totalToPay = outstanding + penaltyAmount;
      onAddRepayment(
        loan.id, 
        totalToPay, 
        `Trả hết nợ gốc (${formatCurrency(outstanding, profile.currency)})${penaltyAmount > 0 ? ` + Phí phạt trễ hạn (${formatCurrency(penaltyAmount, profile.currency)})` : ''}`,
        false, // isExtension
        outstanding, // principalAmount
        0, // feeAmount
        penaltyAmount // penaltyAmount
      );
    } else if (option === 2) {
      setPaymentSubmitError(null);
      const outstanding = loan.amount - loan.paidAmount;
      const maxLimit = Math.floor((outstanding - 1) / 1000000) * 1000000;

      if (outstanding <= 1000000 || maxLimit < 1000000) {
        setPaymentSubmitError('Khoản nợ có giá trị từ 1tr trở xuống không thể thanh toán một phần!');
        return;
      }

      const customValStr = customAmounts[loan.id];
      let amountToPay = 1000000;
      
      if (customValStr !== undefined && customValStr !== '') {
        const cleanVal = parseInt(customValStr.replace(/\D/g, ''), 10);
        if (!isNaN(cleanVal) && cleanVal > 0) {
          amountToPay = cleanVal;
        } else {
          setPaymentSubmitError('Số tiền nhập không hợp lệ!');
          return;
        }
      }

      // Constrain amountToPay to be multiples of 1 million, between 1 million and maxLimit
      amountToPay = Math.min(Math.max(1000000, amountToPay), maxLimit);
      amountToPay = Math.floor(amountToPay / 1000000) * 1000000;

      if (amountToPay <= 0) {
        setPaymentSubmitError('Số tiền thanh toán phải lớn hơn 0!');
        return;
      }

      if (amountToPay >= outstanding) {
        setPaymentSubmitError(`Số tiền trả một phần phải nhỏ hơn dư nợ gốc hiện tại (${formatCurrency(outstanding, profile.currency)})!`);
        return;
      }

      const remainingPrincipal = outstanding - amountToPay;
      const isPromoActive = new Date() < new Date('2026-06-18');
      const partialFee = isPromoActive ? 0 : Math.round(remainingPrincipal * 0.15);
      const totalAmountToPay = amountToPay + partialFee + penaltyAmount;

      onAddRepayment(
        loan.id, 
        totalAmountToPay, 
        isPromoActive
          ? `Trả một phần nợ gốc: Giảm gốc ${formatCurrency(amountToPay, profile.currency)} (Miễn phí duy trì đến hết 17/6/2026)${penaltyAmount > 0 ? ` + Phí phạt trễ hạn bắt buộc ${formatCurrency(penaltyAmount, profile.currency)}` : ''}`
          : `Trả một phần nợ gốc: Giảm gốc ${formatCurrency(amountToPay, profile.currency)} + thu phí duy trì 15% trên dư nợ còn lại ${formatCurrency(partialFee, profile.currency)}${penaltyAmount > 0 ? ` + Phí phạt trễ hạn bắt buộc ${formatCurrency(penaltyAmount, profile.currency)}` : ''}`,
        false, // isExtension
        amountToPay, // principalAmount
        partialFee, // feeAmount
        penaltyAmount // penaltyAmount
      );
    } else if (option === 3) {
      const isPromoActive = new Date() < new Date('2026-06-18');
      const extensionFee = isPromoActive ? 0 : Math.round(loan.amount * 0.15);
      const totalAmountToPay = extensionFee + penaltyAmount;
      onAddRepayment(
        loan.id, 
        totalAmountToPay, 
        isPromoActive
          ? `Gia hạn nợ: Miễn phí dịch vụ bảo hiểm gia hạn đến hết 17/6/2026${penaltyAmount > 0 ? ` + Phí phạt trễ hạn bắt buộc ${formatCurrency(penaltyAmount, profile.currency)}` : ''}`
          : `Gia hạn nợ: Phí dịch vụ bảo hiểm ${formatCurrency(extensionFee, profile.currency)}${penaltyAmount > 0 ? ` + Phí phạt trễ hạn bắt buộc ${formatCurrency(penaltyAmount, profile.currency)}` : ''}`,
        true, // isExtension trigger
        0, // principalAmount
        extensionFee, // feeAmount
        penaltyAmount // penaltyAmount
      );
    }

    // Reset default selected payment type back to full
    setSelectedPaymentOption(1);
    setCustomAmounts(prev => {
      const copy = { ...prev };
      delete copy[loan.id];
      return copy;
    });
    setExpandedLoanId(null);
  };

  return (
    <div className="space-y-6 pb-24" id="loans-view-container">
      {/* View Header */}
      <div className="flex justify-between items-center" id="loans-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Sổ Vay/Cho Vay</h1>
          <p className="text-neutral-400 text-sm">Ghi nhận và thu thanh toán linh hoạt</p>
        </div>
      </div>

      {/* Grid summarizing Loan outstanding */}
      <div id="active-debts-cards">
        <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
              <HandHeart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-mono text-neutral-500">TỔNG GỐC CHO VAY ĐANG HOẠT ĐỘNG</p>
              <p className="text-2xl font-bold text-white font-display mt-0.5">
                {formatCurrency(totalLentAmountActive, profile.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="space-y-3" id="loans-filter-controls">
        <div className="flex gap-2" id="status-horizontal-pills">
          <button
            onClick={() => setActiveStatusTab('active')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeStatusTab === 'active'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            💸 Chưa hoàn thành
          </button>
          <button
            onClick={() => setActiveStatusTab('paid')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeStatusTab === 'paid'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ✅ Đã hoàn thành xong
          </button>
          <button
            onClick={() => setActiveStatusTab('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeStatusTab === 'all'
                ? 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Mọi hồ sơ
          </button>
        </div>
      </div>

      {/* Main List of Loans */}
      <div className="space-y-3" id="loans-history-list">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/10 border border-neutral-800/80 rounded-2xl" id="loans-empty-state">
            <CheckCircle2 className="w-8 h-8 mx-auto text-neutral-700 mb-2" />
            <p className="text-sm text-neutral-500">Không có khoản nợ nào trong bộ lọc này.</p>
          </div>
        ) : (
          filteredLoans.map(loan => {
            const isExpanded = expandedLoanId === loan.id;
            const outstanding = loan.amount - loan.paidAmount;
            const progressRatio = (loan.paidAmount / loan.amount) * 100;
            const isOverdue = loan.status === 'active' && loan.dueDate && new Date(loan.dueDate) < new Date();
            
            // Call penalty calculator
            const { daysOverdue, penaltyAmount } = calculateOverduePenalty(loan);

            return (
              <div 
                key={loan.id} 
                className={`bg-neutral-900/50 border transition-all rounded-3xl overflow-hidden ${
                  isExpanded ? 'border-orange-500/50 bg-neutral-900 shadow-xl shadow-orange-500/5' : 'border-neutral-800'
                }`}
              >
                {/* Header view with vital stats */}
                <div 
                  onClick={() => {
                    setExpandedLoanId(isExpanded ? null : loan.id);
                    setSelectedPaymentOption(1); // Reset selected option on toggle
                  }}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                      loan.type === 'lend' 
                        ? 'bg-orange-500/10 text-orange-400' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {loan.type === 'lend' ? <HandHeart className="w-5 h-5" /> : <HandCoins className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-white leading-none">{loan.person}</span>
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          loan.status === 'paid' 
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : isOverdue 
                            ? 'bg-red-500/15 text-red-400' 
                            : 'bg-orange-500/15 text-orange-400'
                        }`}>
                          {loan.status === 'paid' ? 'Đã tất toán' : isOverdue ? 'Quá hạn' : 'Đang nợ'}
                        </span>
                        
                        {/* Overdue alert badge right in the list header */}
                        {penaltyAmount > 0 && (
                          <span className="text-[9.5px] bg-red-500 text-black px-1.5 py-0.5 rounded font-bold transition-all animate-pulse">
                            +{formatCurrency(penaltyAmount, profile.currency)} Phạt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{loan.note || 'Không ghi chú'}</p>
                      
                      {/* Dates */}
                      <p className="text-[10px] text-neutral-500 font-mono mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-600" /> Nhận nợ: {formatDate(loan.date)}
                        </span>
                        {loan.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
                            <Calendar className="w-3 h-3 text-neutral-600" /> Hạn trả: {formatDate(loan.dueDate)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Financial outcome status */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-white font-mono">
                        {formatCurrency(outstanding + penaltyAmount, profile.currency)}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Gốc: {formatCurrency(loan.amount, profile.currency)}
                      </p>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar representing repaid percentage */}
                <div className="px-4 pb-1.5">
                  <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        loan.status === 'paid' ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(progressRatio, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Detailed interactions */}
                {isExpanded && (
                  <div className="border-t border-neutral-800 bg-neutral-950/40 p-4 space-y-4">
                    
                    {/* Detail Grid with Overdue Penalty integrated cleanly into 4-column metrics card */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className="bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                        <p className="text-[9px] text-neutral-500 uppercase font-mono mb-1">Gốc ban đầu</p>
                        <p className="font-bold text-white font-mono text-[11px] truncate">{formatCurrency(loan.amount, profile.currency)}</p>
                      </div>
                      <div className="bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                        <p className="text-[9px] text-emerald-500 uppercase font-mono mb-1">Đã trả</p>
                        <p className="font-bold text-emerald-400 font-mono text-[11px] truncate">{formatCurrency(loan.paidAmount, profile.currency)}</p>
                      </div>
                      <div className="bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                        <p className="text-[9px] text-orange-500 uppercase font-mono mb-1">Đang nợ</p>
                        <p className="font-bold text-orange-400 font-mono text-[11px] truncate">{formatCurrency(outstanding, profile.currency)}</p>
                      </div>
                      <div className="bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                        <p className="text-[9px] text-red-500 uppercase font-mono mb-1">Phạt trễ hạn</p>
                        <p className={`font-bold font-mono text-[11px] truncate ${penaltyAmount > 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                          {formatCurrency(penaltyAmount, profile.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Detailed info card list describing all loan parameters */}
                    <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-3.5 space-y-2.5 text-xs text-neutral-300">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 pb-2 border-b border-neutral-850">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span>📋 Chi tiết hợp đồng quản lý nợ</span>
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Đối tác:</span>
                          <span className="font-bold text-white">{loan.person} (Bên {loan.type === 'lend' ? 'vay' : 'cho vay'})</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Loại giao dịch:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${loan.type === 'lend' ? 'bg-orange-500/10 text-orange-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            {loan.type === 'lend' ? 'Cho vay (Thu phí 15% trước)' : 'Đi vay'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Ngày giải ngân:</span>
                          <span className="font-mono text-white">{formatDate(loan.date)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Hạn thanh toán gốc:</span>
                          <span className={`font-mono font-bold ${isOverdue ? 'text-red-400' : 'text-neutral-300'}`}>
                            {loan.dueDate ? formatDate(loan.dueDate) : 'Không có'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Tổng gốc hợp đồng:</span>
                          <span className="font-mono text-white font-bold">{formatCurrency(loan.amount, profile.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Tổng gốc đã trả:</span>
                          <span className="font-mono text-emerald-400 font-bold">{formatCurrency(loan.paidAmount, profile.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Dư nợ gốc còn lại:</span>
                          <span className="font-mono text-orange-400 font-bold">{formatCurrency(outstanding, profile.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850">
                          <span className="text-neutral-500">Thu phí trước giải ngân:</span>
                          <span className="font-mono text-neutral-400 font-medium font-sans">
                            {loan.type === 'lend' 
                              ? (loan.id.startsWith('loan-m') 
                                ? '0 đ (Miễn phí hỗ trợ)' 
                                : `${formatCurrency(loan.amount * 0.15, profile.currency)} (15% thu trước)`)
                              : 'Chỉ áp dụng với khoản cho vay'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-neutral-850 sm:col-span-2">
                          <span className="text-neutral-500">Trạng thái:</span>
                          <span className={`font-bold flex items-center gap-1.5 ${
                            loan.status === 'paid' 
                              ? 'text-emerald-400' 
                              : isOverdue 
                              ? 'text-red-400 font-bold animate-pulse' 
                              : 'text-orange-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              loan.status === 'paid' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                            {loan.status === 'paid' 
                              ? 'Đã tất toán (Hồ sơ hoàn thành)' 
                              : isOverdue 
                              ? `Quá hạn nợ chậm trả ${daysOverdue} ngày (Phạt phát sinh: ${formatCurrency(penaltyAmount, profile.currency)})` 
                              : 'Đang hoạt động (Còn trong hạn)'
                            }
                          </span>
                        </div>
                        {loan.note && (
                          <div className="flex flex-col gap-1.5 py-1.5 sm:col-span-2">
                            <span className="text-neutral-500">Mục đích vay / Ghi chú hợp đồng:</span>
                            <p className="text-neutral-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-805/40 italic leading-relaxed text-[11px] font-sans">{loan.note}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Overdue accrued penalty description notice */}
                    {penaltyAmount > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex flex-col gap-1 items-start" id="overdie-accrued-alert">
                        <span className="font-bold flex items-center gap-1 text-red-400">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" /> ĐÃ QUÁ HẠN {daysOverdue} NGÀY
                        </span>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          Hệ thống đã tự động tính phí phạt trễ hạn theo quy chế (<span className="text-white font-medium">nợ gốc x 0.1%/ngày</span>, chặn trần tối đa 30%). Số tiền phạt đã tích lũy là <strong className="text-red-400">{formatCurrency(penaltyAmount, profile.currency)}</strong>.
                        </p>
                      </div>
                    )}

                    {/* Dynamic Segmented repayment choices (Option 1, Option 2, Option 3) */}
                    {loan.status === 'active' && outstanding > 0 && (() => {
                      const maxLimit = Math.floor((outstanding - 1) / 1000000) * 1000000;
                      const canPayPartial = outstanding > 1000000 && maxLimit >= 1000000;

                      return (
                        <div className="space-y-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/60 flex flex-col">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Chọn phương án thanh toán</p>
                          
                          <div className="grid grid-cols-3 gap-1 px-1 py-1 rounded-xl bg-neutral-950 border border-neutral-800">
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentOption(1)}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 leading-none ${
                                selectedPaymentOption === 1
                                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span>1. Trả hết gốc</span>
                              <span className="text-[8.5px] opacity-80 mt-1 font-mono">{(outstanding + penaltyAmount).toLocaleString('vi-VN')} đ</span>
                            </button>
                            
                            <button
                              type="button"
                              disabled={!canPayPartial}
                              onClick={() => setSelectedPaymentOption(2)}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-all text-center flex flex-col items-center justify-center gap-0.5 leading-none ${
                                !canPayPartial
                                  ? 'opacity-30 cursor-not-allowed select-none'
                                  : selectedPaymentOption === 2
                                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10 cursor-pointer'
                                  : 'text-neutral-400 hover:text-white cursor-pointer'
                              }`}
                            >
                              <span>2. Trả một phần</span>
                              <span className="text-[8.5px] opacity-80 mt-1 font-mono">
                                {!canPayPartial 
                                  ? 'Yêu cầu > 1tr' 
                                  : (() => {
                                      const rawVal = customAmounts[loan.id] 
                                        ? parseInt(customAmounts[loan.id].replace(/\D/g, ''), 10) 
                                        : 1000000;
                                      const actualVal = isNaN(rawVal) ? 1000000 : Math.min(Math.max(1000000, rawVal), maxLimit);
                                      const remainingPrincipal = outstanding - actualVal;
                                      const isPromoActive = new Date() < new Date('2026-06-18');
                                      const partialFee = isPromoActive ? 0 : Math.round(remainingPrincipal * 0.15);
                                      const totalVal = actualVal + partialFee + penaltyAmount;
                                      return totalVal.toLocaleString('vi-VN') + ' đ';
                                    })()
                                }
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPaymentOption(3)}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 leading-none ${
                                selectedPaymentOption === 3
                                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span>3. Gia hạn nợ</span>
                              <span className="text-[8.5px] opacity-80 mt-1 font-mono">
                                {(() => {
                                  const isPromoActive = new Date() < new Date('2026-06-18');
                                  const extensionFee = isPromoActive ? 0 : Math.round(loan.amount * 0.15);
                                  return (extensionFee + penaltyAmount).toLocaleString('vi-VN');
                                })()} đ
                              </span>
                            </button>
                          </div>

                          {/* Interactive Dynamic Help Guides */}
                          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 text-[11px] leading-relaxed">
                            {selectedPaymentOption === 1 && (
                              <div className="space-y-2 text-left">
                                <div className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2 rounded-xl text-[10.5px]">
                                  <span className="text-neutral-400">Chi phí phát sinh thực tế:</span>
                                  <span className={`font-mono font-bold ${penaltyAmount > 0 ? 'text-red-400 bg-red-500/5 px-2 py-0.5 border border-red-500/10 rounded' : 'text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded'}`}>
                                    {penaltyAmount > 0 ? `${formatCurrency(penaltyAmount, profile.currency)} (Phí trễ hạn)` : '0 đ (Không phát sinh)'}
                                  </span>
                                </div>
                                <div className="space-y-1.5 p-1 text-[10px] text-neutral-400">
                                  <div className="flex justify-between">
                                    <span>Nợ gốc tất toán:</span>
                                    <span className="font-mono text-white">{formatCurrency(outstanding, profile.currency)}</span>
                                  </div>
                                </div>
                                <div className="h-px bg-neutral-900 my-1" />
                                <div className="flex justify-between items-center text-xs font-bold pt-0.5">
                                  <span className="text-orange-400">Tổng thực nhận thanh lý:</span>
                                  <span className="font-mono text-amber-500 text-sm">{formatCurrency(outstanding + penaltyAmount, profile.currency)}</span>
                                </div>
                              </div>
                            )}

                            {selectedPaymentOption === 2 && canPayPartial && (
                              <div className="space-y-3 text-left">
                                {(() => {
                                  const rawVal = customAmounts[loan.id] 
                                    ? parseInt(customAmounts[loan.id].replace(/\D/g, ''), 10) 
                                    : 1000000;
                                  const amountToPay = isNaN(rawVal) ? 1000000 : Math.min(Math.max(1000000, rawVal), maxLimit);
                                  const nextOutstanding = outstanding - amountToPay;
                                  const isPromoActive = new Date() < new Date('2026-06-18');
                                  const currentFeeAmount = isPromoActive ? 0 : Math.round(nextOutstanding * 0.15);
                                  const totalIncurredFees = currentFeeAmount + penaltyAmount;
                                  const totalPayment = amountToPay + currentFeeAmount + penaltyAmount;

                                  return (
                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-neutral-400 text-[10.5px]">Số gốc muốn trả:</span>
                                          <span className="font-mono text-white text-xs font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                            {formatCurrency(amountToPay, profile.currency)}
                                          </span>
                                        </div>
                                        <input
                                          type="range"
                                          min={1000000}
                                          max={maxLimit}
                                          step={1000000}
                                          value={amountToPay}
                                          onChange={(e) => handleAmountChange(loan.id, e.target.value)}
                                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 focus:outline-none"
                                        />
                                        <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                                          <span>Tối thiểu: 1.000.000 đ</span>
                                          <span>Tối đa: {formatCurrency(maxLimit, profile.currency)}</span>
                                        </div>
                                      </div>

                                      <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl space-y-1.5 text-[10.5px]">
                                        <div className="flex justify-between items-center text-orange-400 font-semibold mb-1">
                                          <span>Tổng phí phát sinh:</span>
                                          <span className="font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                                            {formatCurrency(totalIncurredFees, profile.currency)}
                                          </span>
                                        </div>
                                        <div className="space-y-1 text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-1.5">
                                          <div className="flex justify-between">
                                            <span>• Phí duy trì dư nợ (15% nợ gốc còn lại):</span>
                                            <span className="font-mono text-emerald-400">
                                              {isPromoActive ? '0 đ (Miễn phí đến hết 17/6/2026)' : `+${formatCurrency(currentFeeAmount, profile.currency)}`}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>• Phí phạt quá hạn:</span>
                                            <span className={`font-mono ${penaltyAmount > 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                                              {penaltyAmount > 0 ? `+${formatCurrency(penaltyAmount, profile.currency)}` : '0 đ'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>• Thu hồi nợ gốc đợt này:</span>
                                            <span className="font-mono text-white">{formatCurrency(amountToPay, profile.currency)}</span>
                                          </div>
                                        </div>
                                        <div className="h-px bg-neutral-800/70 my-1" />
                                        <div className="flex justify-between text-white font-bold text-xs pt-0.5">
                                          <span>Tổng thực tế cần đóng:</span>
                                          <span className="font-mono text-amber-500 text-sm">{formatCurrency(totalPayment, profile.currency)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {selectedPaymentOption === 3 && (
                              <div className="space-y-3 text-left">
                                {(() => {
                                  const isPromoActive = new Date() < new Date('2026-06-18');
                                  const extensionFee = isPromoActive ? 0 : Math.round(loan.amount * 0.15);
                                  const totalIncurredFees = extensionFee + penaltyAmount;

                                  return (
                                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl space-y-1.5 text-[10.5px]">
                                      <div className="flex justify-between items-center text-orange-400 font-semibold mb-1">
                                        <span>Phí phát sinh đóng kỳ này:</span>
                                        <span className="font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                                          {formatCurrency(totalIncurredFees, profile.currency)}
                                        </span>
                                      </div>
                                      <div className="space-y-1 text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-1.5">
                                        <div className="flex justify-between">
                                          <span>• Phí dịch vụ gia hạn (15% gốc ban đầu):</span>
                                          <span className="font-mono text-emerald-400">
                                            {isPromoActive ? '0 đ (Miễn phí đến hết 17/6/2026)' : `+${formatCurrency(extensionFee, profile.currency)}`}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>• Phí phạt trễ hạn lũy kế:</span>
                                          <span className={`font-mono ${penaltyAmount > 0 ? 'text-red-400 font-semibold' : 'text-neutral-500'}`}>
                                            {penaltyAmount > 0 ? `+${formatCurrency(penaltyAmount, profile.currency)}` : '0 đ'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>• Nợ gốc dời hạn:</span>
                                          <span className="font-mono text-white">0 đ (Giữ nguyên gốc cũ)</span>
                                        </div>
                                      </div>
                                      <div className="h-px bg-neutral-800/70 my-1" />
                                      <div className="flex justify-between text-white font-bold text-xs pt-0.5">
                                        <span>Tổng thực tế cần đóng:</span>
                                        <span className="font-mono text-amber-500 text-sm">{formatCurrency(totalIncurredFees, profile.currency)}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                        {paymentSubmitError && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{paymentSubmitError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDynamicPaymentSubmit(loan, selectedPaymentOption)}
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-tight flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Thực hiện giao dịch
                        </button>
                      </div>
                    );
                  })()}

                    {/* Repayment History Panel */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-orange-500" /> Nhật ký nợ ({loan.repayments.length})
                      </p>
                      {loan.repayments.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic block pl-1">Chưa ghi nhận đợt thanh toán nào.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {loan.repayments.map((rep, idx) => {
                            const isBeingEdited = editingRepaymentId === rep.id;
                            const isConfirmingDelete = confirmingDeleteRepId === rep.id;

                            if (isBeingEdited) {
                              return (
                                <div key={rep.id} className="p-3 bg-neutral-950 border border-orange-500/40 rounded-xl text-xs space-y-2.5-left">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9.5px] text-neutral-400 font-bold mb-1 block text-left">Số tiền ({profile.currency === 'VND' ? 'đ' : '$'})</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9.]*"
                                        value={editRepAmount}
                                        onChange={(e) => setEditRepAmount(formatNumberWithDots(e.target.value))}
                                        placeholder="Nhập số tiền..."
                                        className="w-full bg-neutral-900 border border-neutral-805 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9.5px] text-neutral-400 font-bold mb-1 block text-left">Ghi chú</label>
                                      <input
                                        type="text"
                                        value={editRepNote}
                                        onChange={(e) => setEditRepNote(e.target.value)}
                                        placeholder="Ghi chú thanh toán..."
                                        className="w-full bg-neutral-900 border border-neutral-805 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                                      />
                                    </div>
                                  </div>
                                  {repaymentError && (
                                    <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                      <span>{repaymentError}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={handleCancelEditRepayment}
                                      className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 hover:text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" /> Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRepayment(loan.id, rep.id)}
                                      className="px-3 py-1 text-[10px] font-bold text-black bg-orange-500 rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3 stroke-[2.5]" /> Lưu
                                    </button>
                                  </div>
                                </div>
                              );
                            } else if (isConfirmingDelete) {
                              return (
                                <div key={rep.id} className="p-2.5 bg-red-500/10 border border-red-200/50 rounded-xl text-xs space-y-2 animate-fade-in text-left">
                                  <div className="flex items-start gap-1.5 text-neutral-300">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>
                                      Xóa đợt thanh toán "{rep.note}" ({formatCurrency(rep.amount, profile.currency)})? Gốc khoản nợ này sẽ tăng lên tương ứng.
                                    </span>
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingDeleteRepId(null)}
                                      className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteRepayment(loan.id, rep.id);
                                        setConfirmingDeleteRepId(null);
                                      }}
                                      className="px-3 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all cursor-pointer"
                                    >
                                      Xóa đợt này
                                    </button>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={rep.id} className="group flex justify-between items-center p-2.5 bg-neutral-950 border border-neutral-800/40 hover:border-neutral-800 rounded-xl text-xs transition-all">
                                  <div className="flex-1 min-w-0 pr-2 text-left">
                                    <p className="text-white font-medium truncate">{rep.note}</p>
                                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{formatDate(rep.date)}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-emerald-400 font-mono whitespace-nowrap">
                                      +{formatCurrency(rep.amount, profile.currency)}
                                    </span>
                                    <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditRepayment(rep)}
                                        title="Sửa"
                                        className="p-1 text-neutral-400 hover:text-orange-400 hover:bg-neutral-900 rounded-md transition-colors cursor-pointer"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmingDeleteRepId(rep.id)}
                                        title="Xóa"
                                        className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-md transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>

                    {/* Dangerous tools spacer line */}
                    <div className="h-px bg-neutral-800/80 my-3" />

                    {/* Actions panel row with edit/delete functions */}
                    {confirmingDeleteLoanId === loan.id ? (
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-xs space-y-2.5 animate-fade-in text-left">
                        <div className="flex items-start gap-2 text-neutral-300">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block text-left">Xác nhận xóa hồ sơ?</span>
                            <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal text-left">
                              Hành động này sẽ xóa vĩnh viễn toàn bộ nhật ký nợ và thông tin khoản vay của <strong className="text-white">"{loan.person}"</strong> có trị giá gốc {formatCurrency(loan.amount, profile.currency)}.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteLoanId(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLoan(loan.id);
                              setConfirmingDeleteLoanId(null);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition overflow-hidden cursor-pointer"
                          >
                            Xóa vĩnh viễn
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(loan.id)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              loan.status === 'paid'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {loan.status === 'paid' ? '🔓 Đang hoạt động' : '✔️ Đã tất toán'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingLoan(loan)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-300 hover:text-white bg-neutral-900/40 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3 text-orange-500" /> Sửa
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteLoanId(loan.id)}
                          className="text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xoá hồ sơ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Loan Modal portal */}
      <EditLoanModal 
        isOpen={editingLoan !== null}
        loan={editingLoan}
        onClose={() => setEditingLoan(null)}
        onSave={onEditLoan}
        people={people}
        currencySymbol={profile.currency === 'VND' ? 'đ' : '$'}
      />
    </div>
  );
}
