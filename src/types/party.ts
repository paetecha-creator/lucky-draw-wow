export interface EmployeeRoster {
  id: string; // Employee ID (รหัสพนักงาน)
  fullName: string;
  nickname: string;
  department: string;
  tableNumber: string; // e.g. "โต๊ะ 01 (VIP)", "โต๊ะ 05"
  groupRole?: string; // e.g. "พนักงานทั่วไป", "ผู้บริหาร/กรรมการ", "ทีมงานจัดเลี้ยง"
  phone?: string;
  isBlockedFromDraw?: boolean; // Blocked from lucky draw
}

export interface AttendeeRegistration {
  id: string; // Registration ID
  employeeId: string;
  fullName: string;
  nickname: string;
  department: string;
  tableNumber: string;
  phone: string;
  selfieUrl: string; // Data URL or Image string
  registeredAt: string; // ISO string
  dietaryOrNote?: string;
  groupRole?: string;
  isBlockedFromDraw?: boolean;
}

export interface Prize {
  id: string;
  name: string;
  tier: string; // e.g. "รางวัลที่ 1", "รางวัลใหญ่ (Grand Prize)", "รางวัลพิเศษ"
  quantity: number;
  remaining: number;
  sponsor?: string;
  iconName?: string;
  description?: string;
  color?: string;
  imageUrl?: string; // Attached sample image of the prize
}

export interface LuckyDrawRecord {
  id: string;
  prizeId: string;
  prizeName: string;
  prizeTier: string;
  employeeId: string;
  winnerName: string;
  nickname: string;
  department: string;
  tableNumber: string;
  selfieUrl?: string;
  prizeImageUrl?: string;
  wonAt: string; // ISO string
  round: number;
}

export interface PartyConfig {
  eventName: string;
  eventDate: string;
  eventVenue: string;
  themeColor: string;
  isRegistrationOpen: boolean;
  blockedGroups: string[]; // List of group names blocked from lucky draw
  autoBlockPreviousWinners: boolean; // Cannot win twice
  isVipTriggerActive: boolean; // Admin unlocks button for Executive
  vipActivePrizeId?: string; // Target prize for VIP draw
}
