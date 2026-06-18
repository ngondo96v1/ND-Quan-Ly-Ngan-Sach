/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loan, LoanType, LoanStatus } from '../types';
import { X, Calendar, User, FileText, BarChart, HardDrive } from 'lucide-react';

interface EditLoanModalProps {
  isOpen: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSave: (updatedLoan: Loan) => void;
  people: string[];
  currencySymbol: string;
}

export default function EditLoanModal({
  isOpen,
  loan,
  onClose,
  onSave,
  people,
  currencySymbol,
}: EditLoanModalProps) {
  const [loanType, setLoanType] = useState<LoanType>('lend');
  const [loanPerson, setLoanPerson] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPaidAmount, setLoanPaidAmount] = useState('');
  const [loanDate, setLoanDate] = useState('');
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNote, setLoanNote] = useState('');
  const [loanStatus, setLoanStatus] = useState<LoanStatus>('active');

  useEffect(() => {
    if (loan) {
      setLoanType(loan.type);
      setLoanPerson(loan.person);
      setLoanAmount(formatNumberWithDots(loan.amount.toString()));
      setLoanPaidAmount(formatNumberWithDots(loan.paidAmount.toString()));
      setLoanDate(loan.date);
      setLoanDueDate(loan.dueDate || '');
      setLoanNote(loan.note);
      setLoanStatus(loan.status);
    }
  }, [loan, isOpen]);

  if (!isOpen || !loan) return null;

  // Helper formatting function: adds dot separators for thousands
  function formatNumberWithDots(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const handleAmountChange = (valRaw: string, setter: (v: string) => void) => {
    setter(formatNumberWithDots(valRaw));
  };

  const computeDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-indexed (1-12)
    const day = parseInt(parts[2], 10);

    // Number of days in the loan's current month
    const daysInMonth = new Date(year, month, 0).getDate();
    const remainingDays = daysInMonth - day;

    // Nếu thời gian còn lại trong tháng >= 10 ngày, thì đến hạn vào ngày 1 của tháng kế tiếp.
    // Ngược lại (ít hơn 10 ngày), dời hạn đến ngày 1 của tháng sau nữa để đảm bảo khoảng đệm tối thiểu.
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

  const syncDueDate = () => {
    setLoanDueDate(computeDueDate(loanDate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(loanAmount.replace(/\D/g, '')) || 0;
    const cleanPaidAmount = parseFloat(loanPaidAmount.replace(/\D/g, '')) || 0;

    if (cleanAmount <= 0) {
      alert('Số tiền tổng khoản nợ phải lớn hơn 0!');
      return;
    }
    if (!loanPerson.trim()) {
      alert('Vui lòng nhập tên đối tác nợ!');
      return;
    }

    // Auto update status if fully paid
    const finalStatus = cleanPaidAmount >= cleanAmount ? 'paid' : loanStatus;

    onSave({
      ...loan,
      type: loanType,
      person: loanPerson.trim(),
      amount: cleanAmount,
      paidAmount: cleanPaidAmount,
      date: loanDate,
      dueDate: loanDueDate || undefined,
      note: loanNote.trim(),
      status: finalStatus,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="edit-loan-modal-overlay">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity animate-fade-in" 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 space-y-5 animate-scale-up">
        {/* Header content */}
        <div className="flex items-center justify-between" id="edit-modal-header">
          <div>
            <span className="text-[10px] bg-orange-500/10 text-orange-500 font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">Sửa thông tin</span>
            <h3 className="text-base font-bold text-white font-display mt-0.5">Hiệu chỉnh khoản vay</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Person field */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Đối tác nợ</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                required
                list="edit-people-list"
                value={loanPerson}
                onChange={(e) => setLoanPerson(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-white text-xs font-sans focus:outline-none focus:border-orange-500"
              />
              <datalist id="edit-people-list">
                {people.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Amount and Paid Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Nợ gốc ({currencySymbol})</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                required
                value={loanAmount}
                onChange={(e) => handleAmountChange(e.target.value, setLoanAmount)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs text-center focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Đã trả ({currencySymbol})</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                required
                value={loanPaidAmount}
                onChange={(e) => handleAmountChange(e.target.value, setLoanPaidAmount)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs text-center focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Date Picker Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Ngày vay</label>
              <input 
                type="date"
                required
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-neutral-400 font-medium">Hạn trả</label>
                <button
                  type="button"
                  onClick={syncDueDate}
                  className="text-[9px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline"
                  title="Tính hạn tự động dựa trên quy tắc chu kỳ 30 ngày (ngày 1 hàng tháng)"
                >
                  Tự tính hạn
                </button>
              </div>
              <input 
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Dropdown status */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Trạng thái khoản nợ</label>
            <select
              value={loanStatus}
              onChange={(e) => setLoanStatus(e.target.value as LoanStatus)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="active">Đang nợ (Chưa hoàn thành)</option>
              <option value="paid">Đã tất toán</option>
            </select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Ghi chú</label>
            <textarea
              value={loanNote}
              onChange={(e) => setLoanNote(e.target.value)}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Submit Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-900 text-neutral-450 border border-neutral-850 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Lưu cập nhật
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
