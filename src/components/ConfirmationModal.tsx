/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message,
  confirmLabel = 'Xóa vĩnh viễn',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="confirm-modal-overlay">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
      />

      {/* Mini Modal Container */}
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col p-5 space-y-4 animate-scale-up">
        {/* Header with Icon */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            variant === 'danger' 
              ? 'bg-red-500/10 text-red-500' 
              : variant === 'warning'
              ? 'bg-orange-500/10 text-orange-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div className="flex items-center gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/15'
                : variant === 'warning'
                ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/15'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/15'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
