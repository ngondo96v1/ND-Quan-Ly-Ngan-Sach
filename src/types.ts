/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTab = 'overview' | 'expenses' | 'loans' | 'settings';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  loanId?: string;
  repaymentId?: string;
}

export type LoanType = 'lend' | 'borrow'; // lend: cho vay (người khác nợ mình), borrow: đi vay (mình nợ người khác)
export type LoanStatus = 'active' | 'paid';

export interface Repayment {
  id: string;
  amount: number;
  date: string;
  note: string;
  isExtension?: boolean;
  principalAmount?: number;
  feeAmount?: number;
  penaltyAmount?: number;
}

export interface Loan {
  id: string;
  type: LoanType;
  person: string;
  amount: number;
  paidAmount: number; // Số tiền đã trả/thu hồi
  date: string; // Ngày vay/cho vay
  dueDate?: string; // Ngày hẹn trả
  note: string;
  status: LoanStatus;
  repayments: Repayment[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface UserProfile {
  name: string;
  currency: 'VND' | 'USD';
  monthlyBudget: number;
  initialBalance?: number;
}
