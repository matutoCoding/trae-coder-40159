import { create } from 'zustand';
import type { Site, Booking, Rate, Bill, DashboardStats, CalculationResult, CreateBookingRequest } from '../../shared/types';
import { siteApi, bookingApi, rateApi, billApi, dashboardApi } from '../lib/api';

interface AppState {
  sites: Site[];
  bookings: Booking[];
  rates: Rate[];
  bills: Bill[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  
  fetchSites: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchRates: () => Promise<void>;
  fetchBills: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  
  createSite: (data: Parameters<typeof siteApi.create>[0]) => Promise<Site | null>;
  updateSite: (id: string, data: Parameters<typeof siteApi.update>[1]) => Promise<Site | null>;
  deleteSite: (id: string) => Promise<boolean>;
  
  createBooking: (data: CreateBookingRequest) => Promise<{ booking: Booking; bill: Bill; calculation: CalculationResult } | null>;
  cancelBooking: (id: string) => Promise<boolean>;
  checkConflict: (siteId: string, checkIn: string, checkOut: string, excludeId?: string) => Promise<{ hasConflict: boolean; conflictingBookings: Booking[] }>;
  calculateFee: (data: Parameters<typeof rateApi.calculate>[0]) => Promise<CalculationResult | null>;
  
  createRate: (data: Parameters<typeof rateApi.create>[0]) => Promise<Rate | null>;
  updateRate: (id: string, data: Parameters<typeof rateApi.update>[1]) => Promise<Rate | null>;
  deleteRate: (id: string) => Promise<boolean>;
  
  payBill: (id: string) => Promise<Bill | null>;
  refundBill: (id: string) => Promise<Bill | null>;
  
  setNotification: (notification: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  clearError: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  sites: [],
  bookings: [],
  rates: [],
  bills: [],
  dashboardStats: null,
  loading: false,
  error: null,
  notification: null,

  fetchSites: async () => {
    set({ loading: true, error: null });
    try {
      const sites = await siteApi.getAll();
      set({ sites, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingApi.getAll();
      set({ bookings, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchRates: async () => {
    set({ loading: true, error: null });
    try {
      const rates = await rateApi.getAll();
      set({ rates, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchBills: async () => {
    set({ loading: true, error: null });
    try {
      const bills = await billApi.getAll();
      set({ bills, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await dashboardApi.getStats();
      set({ dashboardStats: stats, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createSite: async (data) => {
    try {
      const site = await siteApi.create(data);
      set(state => ({ sites: [...state.sites, site] }));
      get().setNotification({ type: 'success', message: '营位创建成功' });
      return site;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  updateSite: async (id, data) => {
    try {
      const site = await siteApi.update(id, data);
      if (site) {
        set(state => ({
          sites: state.sites.map(s => s.id === id ? site : s),
        }));
      }
      get().setNotification({ type: 'success', message: '营位更新成功' });
      return site;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  deleteSite: async (id) => {
    try {
      await siteApi.delete(id);
      set(state => ({
        sites: state.sites.filter(s => s.id !== id),
      }));
      get().setNotification({ type: 'success', message: '营位删除成功' });
      return true;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return false;
    }
  },

  createBooking: async (data) => {
    try {
      const result = await bookingApi.create(data);
      set(state => ({
        bookings: [...state.bookings, result.booking],
        bills: [...state.bills, result.bill as Bill & { customerName: string; siteName: string }],
      }));
      get().setNotification({ type: 'success', message: '预订创建成功' });
      return result;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  cancelBooking: async (id) => {
    try {
      const result = await bookingApi.cancel(id);
      const booking = result.booking;
      set(state => ({
        bookings: state.bookings.map(b => 
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
        bills: state.bills.map(bill => 
          bill.id === booking.billId ? { ...bill, status: 'refunded' as const } : bill
        ),
      }));
      get().setNotification({ type: 'success', message: '预订已取消，时段已释放' });
      return true;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return false;
    }
  },

  checkConflict: async (siteId, checkIn, checkOut, excludeId) => {
    try {
      const result = await bookingApi.checkConflict(siteId, checkIn, checkOut, excludeId);
      return result;
    } catch (error) {
      return { hasConflict: false, conflictingBookings: [] };
    }
  },

  calculateFee: async (data) => {
    try {
      const result = await rateApi.calculate(data);
      return result;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  createRate: async (data) => {
    try {
      const rate = await rateApi.create(data);
      set(state => ({ rates: [...state.rates, rate] }));
      get().setNotification({ type: 'success', message: '费率创建成功' });
      return rate;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  updateRate: async (id, data) => {
    try {
      const rate = await rateApi.update(id, data);
      if (rate) {
        set(state => ({
          rates: state.rates.map(r => r.id === id ? rate : r),
        }));
      }
      get().setNotification({ type: 'success', message: '费率更新成功' });
      return rate;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  deleteRate: async (id) => {
    try {
      await rateApi.delete(id);
      set(state => ({
        rates: state.rates.filter(r => r.id !== id),
      }));
      get().setNotification({ type: 'success', message: '费率删除成功' });
      return true;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return false;
    }
  },

  payBill: async (id) => {
    try {
      const bill = await billApi.pay(id);
      set(state => ({
        bills: state.bills.map(b => b.id === id ? { ...b, status: 'paid' as const } : b),
      }));
      get().setNotification({ type: 'success', message: '账单已标记为已支付' });
      return bill;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  refundBill: async (id) => {
    try {
      const bill = await billApi.refund(id);
      set(state => ({
        bills: state.bills.map(b => b.id === id ? { ...b, status: 'refunded' as const } : b),
      }));
      get().setNotification({ type: 'success', message: '账单已退款' });
      return bill;
    } catch (error) {
      get().setNotification({ type: 'error', message: (error as Error).message });
      return null;
    }
  },

  setNotification: (notification) => {
    set({ notification });
    if (notification) {
      setTimeout(() => set({ notification: null }), 3000);
    }
  },

  clearError: () => set({ error: null }),
}));
