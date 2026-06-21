export type SiteType = 'standard' | 'premium' | 'vip';
export type SiteStatus = 'available' | 'maintenance' | 'closed';
export type BookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type RateType = 'peak' | 'normal' | 'off-peak';
export type BillStatus = 'pending' | 'paid' | 'refunded';
export type BillItemType = 'site_fee' | 'electricity' | 'water' | 'sewer';

export interface Site {
  id: string;
  name: string;
  code: string;
  type: SiteType;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  status: SiteStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  siteId: string;
  customerName: string;
  customerPhone: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  totalAmount: number;
  billId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rate {
  id: string;
  name: string;
  type: RateType;
  siteType: SiteType;
  pricePerDay: number;
  startDate: string;
  endDate: string;
  priority: number;
  electricityRate: number;
  waterRate: number;
  sewerRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: string;
  description: string;
  type: BillItemType;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: string;
}

export interface Bill {
  id: string;
  bookingId: string;
  billNumber: string;
  items: BillItem[];
  subtotal: number;
  total: number;
  status: BillStatus;
  createdAt: string;
  paidAt?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBookings: Booking[];
}

export interface RateSegment {
  rate: Rate;
  startDate: string;
  endDate: string;
  days: number;
}

export interface CalculationResult {
  segments: RateSegment[];
  siteFee: number;
  electricityFee: number;
  waterFee: number;
  sewerFee: number;
  subtotal: number;
  total: number;
  totalDays: number;
}

export interface CreateBookingRequest {
  siteId: string;
  customerName: string;
  customerPhone: string;
  checkIn: string;
  checkOut: string;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
}

export interface CreateRateRequest {
  name: string;
  type: RateType;
  siteType: SiteType;
  pricePerDay: number;
  startDate: string;
  endDate: string;
  priority: number;
  electricityRate: number;
  waterRate: number;
  sewerRate: number;
}

export interface CreateSiteRequest {
  name: string;
  code: string;
  type: SiteType;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  status: SiteStatus;
  description?: string;
}

export interface DashboardStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  occupiedSites: number;
  totalSites: number;
  occupancyRate: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingBookings: number;
}
