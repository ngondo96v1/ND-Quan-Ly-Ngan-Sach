/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppTab, Transaction, Loan, UserProfile, Repayment } from './types';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LOANS 
} from './utils/dummyData';
import Overview from './components/Overview';
import Expenses from './components/Expenses';
import Loans from './components/Loans';
import Settings from './components/Settings';
import QuickAddModal from './components/QuickAddModal';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Plus, 
  Handshake, 
  Settings as SettingsIcon,
  Sparkles,
  Wallet
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [ledgerSubTab, setLedgerSubTab] = useState<number>(0); // 0: Chi tiêu, 1: Thu nhập, 2: Khoản vay
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Floating AssistiveTouch Button state & refs
  const [floatPos, setFloatPos] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 375;
    const height = typeof window !== 'undefined' ? window.innerHeight : 812;
    const defaultX = width > 100 ? width - 64 : 311;
    const defaultY = height > 100 ? (height / 2) - 24 : 382;
    return { x: defaultX, y: defaultY };
  });
  const [isFloatDragging, setIsFloatDragging] = useState(false);
  const floatDragStart = useRef({ x: 0, y: 0 });
  const floatBtnStart = useRef({ x: 0, y: 0 });
  const floatHasMoved = useRef(false);

  // Correct position if screen resizes
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const defaultX = width > 100 ? width - 64 : 311;
    const defaultY = height > 100 ? (height / 2) - 24 : 382;

    setFloatPos({
      x: defaultX,
      y: defaultY
    });

    const handleResize = () => {
      setFloatPos(prev => {
        const maxX = Math.max(16, window.innerWidth - 64);
        const maxY = Math.max(16, window.innerHeight - 150);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag interaction handlers
  const handleFloatPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const isTouch = e.type.startsWith('touch');
    const touchEvent = e as React.TouchEvent;
    const mouseEvent = e as React.MouseEvent;
    
    const clientX = (isTouch && touchEvent.touches && touchEvent.touches.length > 0) 
      ? touchEvent.touches[0].clientX 
      : mouseEvent.clientX;
    const clientY = (isTouch && touchEvent.touches && touchEvent.touches.length > 0) 
      ? touchEvent.touches[0].clientY 
      : mouseEvent.clientY;

    setIsFloatDragging(true);
    floatDragStart.current = { x: clientX, y: clientY };
    floatBtnStart.current = { ...floatPos };
    floatHasMoved.current = false;
  };

  useEffect(() => {
    if (!isFloatDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      // Stop page scrolling while dragging on touch devices
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const isTouch = e.type.startsWith('touch');
      const touchEvent = e as TouchEvent;
      const mouseEvent = e as MouseEvent;
      
      const clientX = (isTouch && touchEvent.touches && touchEvent.touches.length > 0)
        ? touchEvent.touches[0].clientX 
        : mouseEvent.clientX;
      const clientY = (isTouch && touchEvent.touches && touchEvent.touches.length > 0)
        ? touchEvent.touches[0].clientY 
        : mouseEvent.clientY;

      const dx = clientX - floatDragStart.current.x;
      const dy = clientY - floatDragStart.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        floatHasMoved.current = true;
      }

      const nextX = floatBtnStart.current.x + dx;
      const nextY = floatBtnStart.current.y + dy;

      const maxX = Math.max(16, window.innerWidth - 64); 
      const maxY = Math.max(16, window.innerHeight - 150); 

      setFloatPos({
        x: Math.max(16, Math.min(nextX, maxX)),
        y: Math.max(16, Math.min(nextY, maxY))
      });
    };

    const handlePointerUp = () => {
      setIsFloatDragging(false);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isFloatDragging]);

  const handleFloatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!floatHasMoved.current) {
      handleOpenQuickAdd(null);
    }
  };

  const handleFloatTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!floatHasMoved.current) {
      handleOpenQuickAdd(null);
    }
    setIsFloatDragging(false);
  };
  
  // Datastores from LocalStorage with defaults
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('qlct_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('qlct_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('qlct_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  // Dynamic lists for Categories & People
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('qlct_expense_categories');
    return saved ? JSON.parse(saved) : ['Ăn uống', 'Mua sắm', 'Hóa đơn', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Giáo dục'];
  });

  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('qlct_income_categories');
    return saved ? JSON.parse(saved) : ['Lương', 'Làm thêm', 'Đầu tư', 'Quà tặng'];
  });

  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('qlct_category_icons');
    return saved ? JSON.parse(saved) : {};
  });

  const [people, setPeople] = useState<string[]>(() => {
    const saved = localStorage.getItem('qlct_people');
    if (saved) return JSON.parse(saved);
    // Extrapolate initially from initial loans or use defaults
    return ['Trần Hoàng Nam', 'Chị Mai (Đồng nghiệp)', 'Lê Thùy Chi', 'Minh Nhựt', 'Thái Anh', 'Huỳnh Công Tuấn', 'Hào Eco', 'Nguyễn Thị Thắm', 'Dương', 'Linh Hí', 'Chú Quốc', 'Hiệp Nguyễn', 'Chị Tuyền'];
  });

  // Modal State Control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'expense' | 'income' | 'loan' | null>(null);

  // Sync state mutations to LocalStorage
  useEffect(() => {
    localStorage.setItem('qlct_user_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('qlct_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('qlct_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('qlct_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('qlct_income_categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('qlct_category_icons', JSON.stringify(categoryIcons));
  }, [categoryIcons]);

  useEffect(() => {
    localStorage.setItem('qlct_people', JSON.stringify(people));
  }, [people]);

  // One-time automatic migration to import requested loans into existing localStorage
  useEffect(() => {
    const migrationKey = 'qlct_migration_july_loans_v3';
    if (!localStorage.getItem(migrationKey)) {
      // Find loans from INITIAL_LOANS that aren't already in loans state by id
      const missingLoans = INITIAL_LOANS.filter(initL => !loans.some(l => l.id === initL.id));
      if (missingLoans.length > 0) {
        setLoans(prev => {
          const next = [...prev];
          missingLoans.forEach(ml => {
            if (!next.some(nl => nl.id === ml.id)) {
              next.push(ml);
            }
          });
          return next;
        });

        // Add missing people names
        setPeople(prev => {
          const next = [...prev];
          const newNames = ['Minh Nhựt', 'Thái Anh', 'Huỳnh Công Tuấn', 'Hào Eco', 'Nguyễn Thị Thắm', 'Dương', 'Linh Hí', 'Chú Quốc', 'Hiệp Nguyễn', 'Chị Tuyền'];
          newNames.forEach(name => {
            if (!next.includes(name)) {
              next.push(name);
            }
          });
          return next;
        });

        // Update profile initialBalance
        setProfile(prev => ({
          ...prev,
          initialBalance: prev.initialBalance !== undefined && prev.initialBalance > 100000000 ? prev.initialBalance : 120000000
        }));
      }
      localStorage.setItem(migrationKey, 'true');
    }
  }, []);

  // Actions: General
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleExportData = () => {
    return JSON.stringify({
      profile,
      transactions,
      loans,
      expenseCategories,
      incomeCategories,
      categoryIcons,
      people,
      version: '1.0'
    }, null, 2);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed) return false;
      
      // Basic validation checks
      if (parsed.profile) setProfile(parsed.profile);
      if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      if (Array.isArray(parsed.loans)) setLoans(parsed.loans);
      if (Array.isArray(parsed.expenseCategories)) setExpenseCategories(parsed.expenseCategories);
      if (Array.isArray(parsed.incomeCategories)) setIncomeCategories(parsed.incomeCategories);
      if (parsed.categoryIcons) setCategoryIcons(parsed.categoryIcons);
      if (Array.isArray(parsed.people)) setPeople(parsed.people);
      
      // Trigger instant save
      if (parsed.profile) localStorage.setItem('qlct_user_profile', JSON.stringify(parsed.profile));
      if (parsed.transactions) localStorage.setItem('qlct_transactions', JSON.stringify(parsed.transactions));
      if (parsed.loans) localStorage.setItem('qlct_loans', JSON.stringify(parsed.loans));
      if (parsed.expenseCategories) localStorage.setItem('qlct_expense_categories', JSON.stringify(parsed.expenseCategories));
      if (parsed.incomeCategories) localStorage.setItem('qlct_income_categories', JSON.stringify(parsed.incomeCategories));
      if (parsed.categoryIcons) localStorage.setItem('qlct_category_icons', JSON.stringify(parsed.categoryIcons));
      if (parsed.people) localStorage.setItem('qlct_people', JSON.stringify(parsed.people));
      
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleManualSync = (latestProfile?: UserProfile) => {
    // Explicitly force sync cache flush to absolute stability
    localStorage.setItem('qlct_user_profile', JSON.stringify(latestProfile || profile));
    localStorage.setItem('qlct_transactions', JSON.stringify(transactions));
    localStorage.setItem('qlct_loans', JSON.stringify(loans));
    localStorage.setItem('qlct_expense_categories', JSON.stringify(expenseCategories));
    localStorage.setItem('qlct_income_categories', JSON.stringify(incomeCategories));
    localStorage.setItem('qlct_category_icons', JSON.stringify(categoryIcons));
    localStorage.setItem('qlct_people', JSON.stringify(people));
  };

  const handleResetToDefault = () => {
    setProfile(INITIAL_USER_PROFILE);
    setTransactions(INITIAL_TRANSACTIONS);
    setLoans(INITIAL_LOANS);
    setExpenseCategories(['Ăn uống', 'Mua sắm', 'Hóa đơn', 'Di chuyển', 'Giải trí', 'Sức khỏe', 'Giáo dục']);
    setIncomeCategories(['Lương', 'Làm thêm', 'Đầu tư', 'Quà tặng']);
    setCategoryIcons({});
    setPeople(['Trần Hoàng Nam', 'Chị Mai (Đồng nghiệp)', 'Lê Thùy Chi', 'Minh Nhựt', 'Thái Anh', 'Huỳnh Công Tuấn', 'Hào Eco', 'Nguyễn Thị Thắm', 'Dương', 'Linh Hí', 'Chú Quốc', 'Hiệp Nguyễn', 'Chị Tuyền']);
    setActiveTab('overview');
  };

  const handleClearAll = () => {
    setTransactions([]);
    setLoans([]);
    setProfile({
      name: profile.name,
      currency: profile.currency,
      monthlyBudget: 0
    });
    setActiveTab('overview');
  };

  // Actions: Transactions
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    
    if (txToDelete && txToDelete.loanId && txToDelete.repaymentId && txToDelete.repaymentId !== 'upfront-fee') {
      const { loanId, repaymentId } = txToDelete;
      setLoans(prev => prev.map(l => {
        if (l.id === loanId) {
          const repToDelete = l.repayments.find(r => r.id === repaymentId);
          if (!repToDelete) return l;

          const nextRepayments = l.repayments.filter(r => r.id !== repaymentId);

          let nextPaid = l.paidAmount;
          let nextDueDate = l.dueDate;

          if (repToDelete.isExtension) {
            // Revert due date
            if (l.dueDate) {
              const parts = l.dueDate.split('-');
              let year = parseInt(parts[0], 10);
              let month = parseInt(parts[1], 10);
              let prevMonth = month - 1;
              let prevYear = year;
              if (prevMonth < 1) {
                prevMonth = 12;
                prevYear -= 1;
              }
              nextDueDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
            }
          } else {
            const oldReduced = repToDelete.principalAmount !== undefined ? repToDelete.principalAmount : repToDelete.amount;
            nextPaid = l.paidAmount - oldReduced;
          }

          const nextStatus = nextPaid >= l.amount ? 'paid' : 'active';

          return {
            ...l,
            paidAmount: Math.min(Math.max(0, nextPaid), l.amount),
            dueDate: nextDueDate,
            status: nextStatus,
            repayments: nextRepayments
          };
        }
        return l;
      }));
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Actions: Loans
  const handleAddLoan = (newLoan: Omit<Loan, 'id' | 'paidAmount' | 'status' | 'repayments'>) => {
    const loanId = `loan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const loan: Loan = {
      ...newLoan,
      id: loanId,
      paidAmount: 0,
      status: 'active',
      repayments: []
    };
    setLoans(prev => [loan, ...prev]);

    // Cho vay thu phí 15% trước giải ngân
    if (newLoan.type === 'lend') {
      const feeAmount = newLoan.amount * 0.15;
      handleAddTransaction({
        type: 'income',
        amount: feeAmount,
        category: 'Đầu tư',
        date: newLoan.date || new Date().toISOString().slice(0, 10),
        note: `Thu phí 15% trước giải ngân - Người vay: ${newLoan.person}`,
        loanId: loanId,
        repaymentId: 'upfront-fee'
      });
    }

    // Also, auto-add to dynamic people list if not already there
    if (newLoan.person && !people.includes(newLoan.person.trim())) {
      setPeople(prev => [...prev, newLoan.person.trim()]);
    }
  };

  const handleEditLoan = (updatedLoan: Loan) => {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
  };

  const handleDeleteLoan = (loanId: string) => {
    setLoans(prev => prev.filter(l => l.id !== loanId));
    // Sync with transactions: Delete all transactions related to this loan
    setTransactions(prev => prev.filter(t => t.loanId !== loanId));
  };

  const handleToggleLoanStatus = (loanId: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const nextStatus = l.status === 'active' ? 'paid' : 'active';
        return { 
          ...l, 
          status: nextStatus,
          // If marking as paid, match paidAmount to entire amount
          paidAmount: nextStatus === 'paid' ? l.amount : l.paidAmount
        };
      }
      return l;
    }));
  };

  const handleAddRepayment = (
    loanId: string, 
    amount: number, 
    note: string, 
    isExtension: boolean = false,
    principalAmount?: number,
    feeAmount?: number,
    penaltyAmount?: number
  ) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const repId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRepayment: Repayment = {
      id: repId,
      amount,
      date: new Date().toISOString().slice(0, 10),
      note,
      isExtension,
      principalAmount,
      feeAmount,
      penaltyAmount
    };

    let nextPaid = targetLoan.paidAmount;
    let nextDueDate = targetLoan.dueDate;
    let nextStatus = targetLoan.status;

    if (isExtension) {
      // Gia hạn: đẩy ngày đến hạn sang tháng tiếp theo (ngày 1 tháng sau)
      const baseDateStr = targetLoan.dueDate || new Date().toISOString().slice(0, 10);
      const parts = baseDateStr.split('-');
      let year = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      nextDueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else {
      const reducedPrincipal = principalAmount !== undefined ? principalAmount : amount;
      nextPaid = targetLoan.paidAmount + reducedPrincipal;
      nextStatus = nextPaid >= targetLoan.amount ? 'paid' : 'active';
    }

    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          paidAmount: Math.min(nextPaid, l.amount),
          dueDate: nextDueDate,
          status: nextStatus,
          repayments: [newRepayment, ...l.repayments]
        };
      }
      return l;
    }));

    if (targetLoan.type === 'lend') {
      // Collecting money back -> income
      handleAddTransaction({
        type: 'income',
        amount: amount,
        category: 'Làm thêm', // category for loan collection
        date: new Date().toISOString().slice(0, 10),
        note: isExtension
          ? `Thu phí gia hạn từ ${targetLoan.person}: ${note}`
          : `Thu nợ từ ${targetLoan.person}: ${note}`,
        loanId: targetLoan.id,
        repaymentId: repId
      });
    } else {
      // Paying debt -> expense
      handleAddTransaction({
        type: 'expense',
        amount: amount,
        category: 'Hóa đơn', // category for debt payment
        date: new Date().toISOString().slice(0, 10),
        note: isExtension
          ? `Trả phí gia hạn cho ${targetLoan.person}: ${note}`
          : `Trả nợ cho ${targetLoan.person}: ${note}`,
        loanId: targetLoan.id,
        repaymentId: repId
      });
    }
  };

  const handleEditRepayment = (loanId: string, repaymentId: string, newAmount: number, newNote: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const repIndex = l.repayments.findIndex(r => r.id === repaymentId);
        if (repIndex === -1) return l;

        const oldRep = l.repayments[repIndex];
        
        let nextPrincipal = newAmount;
        if (oldRep.principalAmount !== undefined && oldRep.feeAmount !== undefined) {
          nextPrincipal = Math.max(0, newAmount - oldRep.feeAmount);
        }

        const updatedRep: Repayment = { 
          ...oldRep, 
          amount: newAmount, 
          note: newNote,
          principalAmount: oldRep.principalAmount !== undefined ? nextPrincipal : undefined
        };
        const nextRepayments = l.repayments.map(r => r.id === repaymentId ? updatedRep : r);

        let nextPaid = l.paidAmount;
        if (!oldRep.isExtension) {
          const oldReduced = oldRep.principalAmount !== undefined ? oldRep.principalAmount : oldRep.amount;
          const newReduced = oldRep.principalAmount !== undefined ? nextPrincipal : newAmount;
          nextPaid = l.paidAmount - oldReduced + newReduced;
        }

        const nextStatus = nextPaid >= l.amount ? 'paid' : 'active';

        return {
          ...l,
          paidAmount: Math.min(Math.max(0, nextPaid), l.amount),
          status: nextStatus,
          repayments: nextRepayments
        };
      }
      return l;
    }));

    // Sync transition with transactions: Update transaction amount and note
    setTransactions(prev => prev.map(t => {
      if (t.repaymentId === repaymentId) {
        return {
          ...t,
          amount: newAmount,
          note: newNote
        };
      }
      return t;
    }));
  };

  const handleDeleteRepayment = (loanId: string, repaymentId: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const repToDelete = l.repayments.find(r => r.id === repaymentId);
        if (!repToDelete) return l;

        const nextRepayments = l.repayments.filter(r => r.id !== repaymentId);

        let nextPaid = l.paidAmount;
        let nextDueDate = l.dueDate;

        if (repToDelete.isExtension) {
          // Revert due date
          if (l.dueDate) {
            const parts = l.dueDate.split('-');
            let year = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10);
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth < 1) {
              prevMonth = 12;
              prevYear -= 1;
            }
            nextDueDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
          }
        } else {
          const oldReduced = repToDelete.principalAmount !== undefined ? repToDelete.principalAmount : repToDelete.amount;
          nextPaid = l.paidAmount - oldReduced;
        }

        const nextStatus = nextPaid >= l.amount ? 'paid' : 'active';

        return {
          ...l,
          paidAmount: Math.min(Math.max(0, nextPaid), l.amount),
          dueDate: nextDueDate,
          status: nextStatus,
          repayments: nextRepayments
        };
      }
      return l;
    }));

    // Sync with transactions: Delete the transaction associated with the deleted repayment
    setTransactions(prev => prev.filter(t => t.repaymentId !== repaymentId));
  };

  // Categories Handlers
  const handleAddExpenseCategory = (cat: string, icon?: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    if (expenseCategories.includes(trimmed)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    setExpenseCategories(prev => [...prev, trimmed]);
    if (icon) {
      setCategoryIcons(prev => ({ ...prev, [trimmed]: icon }));
    }
  };

  const handleEditExpenseCategory = (oldCat: string, newCat: string, icon?: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (oldCat !== trimmed && expenseCategories.includes(trimmed)) {
      alert('Danh mục mới đã tồn tại!');
      return;
    }
    setExpenseCategories(prev => prev.map(c => c === oldCat ? trimmed : c));
    setTransactions(prev => prev.map(t => t.type === 'expense' && t.category === oldCat ? { ...t, category: trimmed } : t));
    
    // Also update/set icon map
    setCategoryIcons(prev => {
      const copy = { ...prev };
      if (oldCat !== trimmed) {
        delete copy[oldCat];
      }
      if (icon) {
        copy[trimmed] = icon;
      }
      return copy;
    });
  };

  const handleDeleteExpenseCategory = (cat: string) => {
    const remaining = expenseCategories.filter(c => c !== cat);
    const fallbackCat = remaining[0] || '';
    setExpenseCategories(remaining);
    setTransactions(prev => prev.map(t => t.type === 'expense' && t.category === cat ? { ...t, category: fallbackCat } : t));
    
    setCategoryIcons(prev => {
      const copy = { ...prev };
      delete copy[cat];
      return copy;
    });
  };

  const handleAddIncomeCategory = (cat: string, icon?: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    if (incomeCategories.includes(trimmed)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    setIncomeCategories(prev => [...prev, trimmed]);
    if (icon) {
      setCategoryIcons(prev => ({ ...prev, [trimmed]: icon }));
    }
  };

  const handleEditIncomeCategory = (oldCat: string, newCat: string, icon?: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (oldCat !== trimmed && incomeCategories.includes(trimmed)) {
      alert('Danh mục mới đã tồn tại!');
      return;
    }
    setIncomeCategories(prev => prev.map(c => c === oldCat ? trimmed : c));
    setTransactions(prev => prev.map(t => t.type === 'income' && t.category === oldCat ? { ...t, category: trimmed } : t));
    
    // Also update/set icon map
    setCategoryIcons(prev => {
      const copy = { ...prev };
      if (oldCat !== trimmed) {
        delete copy[oldCat];
      }
      if (icon) {
        copy[trimmed] = icon;
      }
      return copy;
    });
  };

  const handleDeleteIncomeCategory = (cat: string) => {
    const remaining = incomeCategories.filter(c => c !== cat);
    const fallbackCat = remaining[0] || '';
    setIncomeCategories(remaining);
    setTransactions(prev => prev.map(t => t.type === 'income' && t.category === cat ? { ...t, category: fallbackCat } : t));
    
    setCategoryIcons(prev => {
      const copy = { ...prev };
      delete copy[cat];
      return copy;
    });
  };

  // People Handlers
  const handleAddPerson = (person: string) => {
    const trimmed = person.trim();
    if (!trimmed) return;
    if (people.includes(trimmed)) {
      alert('Tên người vay này đã tồn tại trong danh bạ!');
      return;
    }
    setPeople(prev => [...prev, trimmed]);
  };

  const handleEditPerson = (oldPerson: string, newPerson: string) => {
    const trimmed = newPerson.trim();
    if (!trimmed || oldPerson === trimmed) return;
    if (people.includes(trimmed)) {
      alert('Tên mới này trùng với một người khác trong danh bạ!');
      return;
    }
    setPeople(prev => prev.map(p => p === oldPerson ? trimmed : p));
    setLoans(prev => prev.map(l => l.person === oldPerson ? { ...l, person: trimmed } : l));
  };

  const handleDeletePerson = (person: string) => {
    setPeople(prev => prev.filter(p => p !== person));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    const threshold = 60; // minimum distance in pixels

    if (diffX > threshold) {
      // Swipe left -> next subTab
      if (ledgerSubTab < 2) {
        setLedgerSubTab(prev => prev + 1);
      }
    } else if (diffX < -threshold) {
      // Swipe right -> previous subTab
      if (ledgerSubTab > 0) {
        setLedgerSubTab(prev => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  const handleOpenQuickAdd = (type: 'expense' | 'income' | 'loan' | null) => {
    setModalDefaultType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-start antialiased selection:bg-orange-500 selection:text-black">
      
      {/* Container wrapper limiting width for perfect desktop viewing & responsive presentation */}
      <div className="w-full max-w-lg min-h-screen bg-neutral-950 flex flex-col border-x border-neutral-900 shadow-2xl relative">
        
        {/* Top bar header */}
        <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur border-b border-neutral-900/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Wallet className="w-4.5 h-4.5 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-display font-bold text-white tracking-tight">Sổ Nhớ Thu Chi & Vay Nợ</span>
              <span className="text-[10px] bg-neutral-800 text-neutral-400 font-mono font-semibold block px-1.5 rounded ml-1 w-fit mt-0.5">V1.0 PRO</span>
            </div>
          </div>
        </header>

        {/* Main interactive frame container */}
        <main className="flex-1 px-5 pt-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <Overview 
              transactions={transactions}
              loans={loans}
              profile={profile}
              categoryIcons={categoryIcons}
              onNavigate={(dest) => {
                if (dest === 'loans') {
                  setActiveTab('expenses');
                  setLedgerSubTab(2);
                } else {
                  setActiveTab('expenses');
                  setLedgerSubTab(0);
                }
              }}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'expenses' && (
            <div 
              className="space-y-5 pb-24" 
              onTouchStart={handleTouchStart} 
              onTouchEnd={handleTouchEnd}
              id="ledger-view-container"
            >
              {/* Header Title for the combined ledger view */}
              <div className="flex justify-between items-center" id="expenses-header">
                <div>
                  <h1 className="text-2xl font-display font-bold text-white leading-none">Sổ Sách</h1>
                  <p className="text-neutral-400 text-xs mt-1.5 leading-none">Vuốt trái/phải hoặc chạm tab để chuyển nhanh</p>
                </div>
              </div>

              {/* Slidable Segmented Controls */}
              <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-neutral-800/60 relative mt-1" id="ledger-segmented-tabs">
                <button 
                  onClick={() => setLedgerSubTab(0)}
                  className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-200 cursor-pointer relative z-10 ${ledgerSubTab === 0 ? 'text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Chi Tiêu
                </button>
                <button 
                  onClick={() => setLedgerSubTab(1)}
                  className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-200 cursor-pointer relative z-10 ${ledgerSubTab === 1 ? 'text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Thu Nhập
                </button>
                <button 
                  onClick={() => setLedgerSubTab(2)}
                  className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-200 cursor-pointer relative z-10 ${ledgerSubTab === 2 ? 'text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Khoản Vay
                </button>
                
                {/* Background Slider Indicator */}
                <div 
                  className="absolute top-1 bottom-1 bg-orange-500 rounded-lg transition-all duration-300 ease-out"
                  style={{
                    left: `calc(${(ledgerSubTab * 33.333)}% + 4px)`,
                    width: 'calc(33.333% - 8px)'
                  }}
                />
              </div>

              {/* Slidable Viewport Container */}
              <div className="w-full overflow-hidden" id="ledger-viewport">
                <div 
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${ledgerSubTab * 100}%)` }}
                >
                  {/* Slide 0: Chi Tiêu */}
                  <div className="w-full shrink-0 pr-1.5" style={{ touchAction: 'pan-y' }}>
                    <Expenses 
                      type="expense"
                      transactions={transactions}
                      profile={profile}
                      expenseCategories={expenseCategories}
                      incomeCategories={incomeCategories}
                      categoryIcons={categoryIcons}
                      onDeleteTransaction={handleDeleteTransaction}
                      onOpenQuickAdd={(type) => handleOpenQuickAdd(type)}
                    />
                  </div>

                  {/* Slide 1: Thu Nhập */}
                  <div className="w-full shrink-0 px-1.5" style={{ touchAction: 'pan-y' }}>
                    <Expenses 
                      type="income"
                      transactions={transactions}
                      profile={profile}
                      expenseCategories={expenseCategories}
                      incomeCategories={incomeCategories}
                      categoryIcons={categoryIcons}
                      onDeleteTransaction={handleDeleteTransaction}
                      onOpenQuickAdd={(type) => handleOpenQuickAdd(type)}
                    />
                  </div>

                  {/* Slide 2: Khoản Vay */}
                  <div className="w-full shrink-0 pl-1.5" style={{ touchAction: 'pan-y' }}>
                    <Loans 
                      loans={loans}
                      profile={profile}
                      onAddRepayment={handleAddRepayment}
                      onEditRepayment={handleEditRepayment}
                      onDeleteRepayment={handleDeleteRepayment}
                      onToggleStatus={handleToggleLoanStatus}
                      onDeleteLoan={handleDeleteLoan}
                      onEditLoan={handleEditLoan}
                      people={people}
                      onOpenQuickAdd={() => handleOpenQuickAdd('loan')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <Settings 
              profile={profile}
              expenseCategories={expenseCategories}
              onAddExpenseCategory={handleAddExpenseCategory}
              onEditExpenseCategory={handleEditExpenseCategory}
              onDeleteExpenseCategory={handleDeleteExpenseCategory}
              incomeCategories={incomeCategories}
              onAddIncomeCategory={handleAddIncomeCategory}
              onEditIncomeCategory={handleEditIncomeCategory}
              onDeleteIncomeCategory={handleDeleteIncomeCategory}
              categoryIcons={categoryIcons}
              people={people}
              onAddPerson={handleAddPerson}
              onEditPerson={handleEditPerson}
              onDeletePerson={handleDeletePerson}
              onUpdateProfile={handleUpdateProfile}
              onResetToDefault={handleResetToDefault}
              onClearAll={handleClearAll}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onManualSync={handleManualSync}
            />
          )}
        </main>
        
        {/* BOTTOM NAVIGATION BAR: requested strictly by the user */}
        {/* Thanh Navibar dưới cùng bao gồm: Tổng quan, Sổ sách, Cài đặt */}
        <nav className="sticky bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-900 px-4 py-3 flex items-center justify-between shadow-2xl animate-fade-in" id="bottom-navbar">
          
          {/* Item 1: Tổng quan */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer group transition-colors ${
              activeTab === 'overview' ? 'text-orange-500 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            id="nav-tab-overview"
          >
            <LayoutDashboard className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Tổng quan</span>
          </button>

          {/* Item 2: Sổ Sách */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer group transition-colors ${
              activeTab === 'expenses' ? 'text-orange-500 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            id="nav-tab-ledger"
          >
            <ReceiptText className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'expenses' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Sổ Sách</span>
          </button>

          {/* Item 3: Cài đặt */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer group transition-colors ${
              activeTab === 'settings' ? 'text-orange-500 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            id="nav-tab-settings"
          >
            <SettingsIcon className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">Cài đặt</span>
          </button>

        </nav>

        {/* DRAGGABLE ASSISTIVETOUCH FLOATING VIRTUAL BUTTON (Iphone Style) */}
        <div
          style={{
            position: 'fixed',
            left: `${floatPos.x}px`,
            top: `${floatPos.y}px`,
            touchAction: 'none'
          }}
          className={`z-50 w-12 h-12 rounded-full flex items-center justify-center cursor-move select-none shadow-2xl relative transition-all duration-75 active:scale-95 ${
            isFloatDragging 
              ? 'bg-orange-500 text-black shadow-orange-500/40 ring-4 ring-orange-500/20' 
              : 'bg-neutral-900/90 text-orange-400 border border-neutral-700/85 hover:border-orange-500/50 hover:bg-neutral-800'
          }`}
          onMouseDown={handleFloatPointerDown}
          onTouchStart={handleFloatPointerDown}
          onClick={handleFloatClick}
          onTouchEnd={handleFloatTouchEnd}
          id="assistive-touch-btn"
          title="Thêm nhanh (Kéo thả tuỳ ý)"
        >
          <Plus className={`w-5.5 h-5.5 stroke-[2.5] transition-transform ${isFloatDragging ? 'scale-110' : ''}`} />
          
          {/* Animated heartbeat outer ring for rich tactile feel */}
          <span className="absolute inset-0 rounded-full border border-orange-500/20 animate-ping pointer-events-none scale-105" />
        </div>

        {/* Global Quick Add Portal Overlay */}
        <QuickAddModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultType={modalDefaultType}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          categoryIcons={categoryIcons}
          people={people}
          onAddTransaction={handleAddTransaction}
          onAddLoan={handleAddLoan}
          currencySymbol={profile.currency === 'VND' ? 'đ' : '$'}
        />

      </div>
    </div>
  );
}
