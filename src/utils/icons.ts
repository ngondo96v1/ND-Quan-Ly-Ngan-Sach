/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  FileText, 
  Car, 
  Gamepad2, 
  HeartPulse, 
  GraduationCap, 
  TrendingUp, 
  Gift, 
  Briefcase, 
  Clock, 
  Coins, 
  Coffee, 
  Home, 
  PartyPopper, 
  Smartphone, 
  Plane, 
  Scissors, 
  Activity, 
  Apple, 
  Sparkles, 
  HelpCircle,
  PiggyBank,
  Hammer
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Utensils, 
  ShoppingBag, 
  FileText, 
  Car, 
  Gamepad2, 
  HeartPulse, 
  GraduationCap, 
  TrendingUp, 
  Gift, 
  Briefcase, 
  Clock, 
  Coins, 
  Coffee, 
  Home, 
  PartyPopper, 
  Smartphone, 
  Plane, 
  Scissors, 
  Activity, 
  Apple, 
  Sparkles, 
  HelpCircle,
  PiggyBank,
  Hammer
};

export const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Ăn uống', emoji: '🍔' },
  { name: 'ShoppingBag', label: 'Mua sắm', emoji: '🛍️' },
  { name: 'FileText', label: 'Hóa đơn', emoji: '📄' },
  { name: 'Car', label: 'Di chuyển', emoji: '🚗' },
  { name: 'Gamepad2', label: 'Giải trí', emoji: '🎮' },
  { name: 'HeartPulse', label: 'Sức khỏe', emoji: '🩺' },
  { name: 'GraduationCap', label: 'Giáo dục', emoji: '🎓' },
  { name: 'Briefcase', label: 'Lương/Công việc', emoji: '💼' },
  { name: 'Clock', label: 'Làm thêm', emoji: '🕒' },
  { name: 'TrendingUp', label: 'Đầu tư', emoji: '📈' },
  { name: 'Gift', label: 'Quà tặng', emoji: '🎁' },
  { name: 'Coins', label: 'Tiền tài', emoji: '🪙' },
  { name: 'Coffee', label: 'Cà phê', emoji: '☕' },
  { name: 'Home', label: 'Nhà cửa', emoji: '🏠' },
  { name: 'PartyPopper', label: 'Tiệc tùng', emoji: '🎉' },
  { name: 'Smartphone', label: 'Công nghệ', emoji: '📱' },
  { name: 'Plane', label: 'Du lịch', emoji: '✈️' },
  { name: 'Scissors', label: 'Làm đẹp', emoji: '✂️' },
  { name: 'Activity', label: 'Thể thao', emoji: '👟' },
  { name: 'Apple', label: 'Ăn vặt/Chợ', emoji: '🍎' },
  { name: 'PiggyBank', label: 'Tiết kiệm', emoji: '🐷' },
  { name: 'Hammer', label: 'Sửa chữa', emoji: '🔨' },
  { name: 'Sparkles', label: 'Đặc trưng', emoji: '✨' },
  { name: 'HelpCircle', label: 'Khác', emoji: '❔' },
];

export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  'Ăn uống': 'Utensils',
  'Mua sắm': 'ShoppingBag',
  'Hóa đơn': 'FileText',
  'Di chuyển': 'Car',
  'Giải trí': 'Gamepad2',
  'Sức khỏe': 'HeartPulse',
  'Giáo dục': 'GraduationCap',
  'Khác': 'HelpCircle',
  'Lương': 'Briefcase',
  'Làm thêm': 'Clock',
  'Đầu tư': 'TrendingUp',
  'Quà tặng': 'Gift',
};

interface GetIconProps {
  name?: string;
  className?: string;
}

export function CategoryIcon({ name, className = 'w-4 h-4' }: GetIconProps) {
  const IconComponent = name ? ICON_MAP[name] : null;
  if (!IconComponent) {
    return React.createElement(HelpCircle, { className });
  }
  return React.createElement(IconComponent, { className });
}

export function getCategoryIconName(catName: string, customMapping: Record<string, string> = {}): string {
  if (customMapping[catName]) {
    return customMapping[catName];
  }
  if (DEFAULT_CATEGORY_ICONS[catName]) {
    return DEFAULT_CATEGORY_ICONS[catName];
  }
  return 'HelpCircle';
}
