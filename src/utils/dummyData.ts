/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Loan, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Nguyễn Văn Minh',
  currency: 'VND',
  monthlyBudget: 15000000, // 15,000,000 VND
  initialBalance: 120000000, // 120,000,000 VND
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 120000,
    category: 'Ăn uống',
    date: '2026-06-15',
    note: 'Ăn trưa văn phòng với đồng nghiệp',
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 450000,
    category: 'Mua sắm',
    date: '2026-06-14',
    note: 'Mua áo thun thể thao mới',
  },
  {
    id: 'tx-3',
    type: 'income',
    amount: 25000000,
    category: 'Lương',
    date: '2026-06-05',
    note: 'Lương tháng 6',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 1200000,
    category: 'Hóa đơn',
    date: '2026-06-10',
    note: 'Tiền điện nước & Internet',
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 350000,
    category: 'Di chuyển',
    date: '2026-06-16',
    note: 'Đổ xăng xe máy & đặt Grab',
  },
  {
    id: 'tx-6',
    type: 'expense',
    amount: 600000,
    category: 'Giải trí',
    date: '2026-06-12',
    note: 'Xem phim & uống cà phê cuối tuần',
  },
  {
    id: 'tx-7',
    type: 'income',
    amount: 1500000,
    category: 'Làm thêm',
    date: '2026-06-15',
    note: 'Bán thiết kế logo freelancer',
  },
  {
    id: 'tx-8',
    type: 'expense',
    amount: 250000,
    category: 'Sức khỏe',
    date: '2026-06-13',
    note: 'Mua thuốc bổ sung vitamin',
  },
  {
    id: 'tx-loan1-fee',
    type: 'income',
    amount: 750000,
    category: 'Đầu tư',
    date: '2026-06-01',
    note: 'Thu phí 15% trước giải ngân - Người vay: Trần Hoàng Nam',
    loanId: 'loan-1',
    repaymentId: 'upfront-fee'
  },
  {
    id: 'tx-loan1-rep1',
    type: 'income',
    amount: 2000000,
    category: 'NDV',
    date: '2026-06-10',
    note: 'Thu nợ từ Trần Hoàng Nam: Trả đợt 1',
    loanId: 'loan-1',
    repaymentId: 'rep-1'
  },
  {
    id: 'tx-loan3-fee',
    type: 'income',
    amount: 225000,
    category: 'Đầu tư',
    date: '2026-05-20',
    note: 'Thu phí 15% trước giải ngân - Người vay: Lê Thùy Chi',
    loanId: 'loan-3',
    repaymentId: 'upfront-fee'
  },
  {
    id: 'tx-loan3-rep1',
    type: 'income',
    amount: 1500000,
    category: 'NDV',
    date: '2026-05-30',
    note: 'Thu nợ từ Lê Thùy Chi: Chuyển khoản trả hết',
    loanId: 'loan-3',
    repaymentId: 'rep-2'
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-m1',
    type: 'lend',
    person: 'Minh Nhựt',
    amount: 20000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m2',
    type: 'lend',
    person: 'Thái Anh',
    amount: 10000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m3',
    type: 'lend',
    person: 'Huỳnh Công Tuấn',
    amount: 10000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m4',
    type: 'lend',
    person: 'Hào Eco',
    amount: 4000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m5',
    type: 'lend',
    person: 'Nguyễn Thị Thắm',
    amount: 4000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m6',
    type: 'lend',
    person: 'Dương',
    amount: 2000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m7',
    type: 'lend',
    person: 'Linh Hí',
    amount: 1000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m8',
    type: 'lend',
    person: 'Chú Quốc',
    amount: 5000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m9',
    type: 'lend',
    person: 'Hiệp Nguyễn',
    amount: 5000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-m10',
    type: 'lend',
    person: 'Chị Tuyền',
    amount: 2000000,
    paidAmount: 0,
    date: '2026-06-18',
    dueDate: '2026-07-01',
    note: 'Vay hỗ trợ (Không tính phí upfront ban đầu)',
    status: 'active',
    repayments: [],
  },
  {
    id: 'loan-1',
    type: 'lend', // Mình cho vay
    person: 'Trần Hoàng Nam',
    amount: 5000000,
    paidAmount: 2000000,
    date: '2026-06-01',
    dueDate: '2026-07-01',
    note: 'Vay mượn mua máy tính bảng',
    status: 'active',
    repayments: [
      {
        id: 'rep-1',
        amount: 2000000,
        date: '2026-06-10',
        note: 'Trả đợt 1',
      }
    ],
  },
  {
    id: 'loan-3',
    type: 'lend', // Mình cho vay và đã trả xong
    person: 'Lê Thùy Chi',
    amount: 1500000,
    paidAmount: 1500000,
    date: '2026-05-20',
    dueDate: '2026-06-01',
    note: 'Nhờ thanh toán hộ vé liveshow',
    status: 'paid',
    repayments: [
      {
        id: 'rep-2',
        amount: 1500000,
        date: '2026-05-30',
        note: 'Chuyển khoản trả hết',
      }
    ],
  }
];

export const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Mua sắm',
  'Hóa đơn',
  'Di chuyển',
  'Giải trí',
  'Sức khỏe',
  'Giáo dục',
];

export const INCOME_CATEGORIES = [
  'Lương',
  'NDV',
  'Đầu tư',
  'Quà tặng',
  'Làm thêm',
];

export function formatCurrency(amount: number, currency: 'VND' | 'USD'): string {
  if (currency === 'VND') {
    return amount.toLocaleString('vi-VN') + ' đ';
  } else {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}
