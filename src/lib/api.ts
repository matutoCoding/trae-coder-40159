import type { Site, Booking, Rate, Bill, BillItem, CreateSiteRequest, CreateBookingRequest, CreateRateRequest, CalculationResult, ConflictCheckResult, DashboardStats } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const siteApi = {
  getAll: () => request<Site[]>('/sites'),
  getById: (id: string) => request<Site>(`/sites/${id}`),
  create: (data: CreateSiteRequest) => request<Site>('/sites', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateSiteRequest>) =>
    request<Site>(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/sites/${id}`, { method: 'DELETE' }),
};

export const bookingApi = {
  getAll: () => request<Booking[]>('/bookings'),
  getById: (id: string) => request<Booking>(`/bookings/${id}`),
  checkConflict: (siteId: string, checkIn: string, checkOut: string, excludeId?: string) => {
    const params = new URLSearchParams({ siteId, checkIn, checkOut });
    if (excludeId) params.append('excludeId', excludeId);
    return request<ConflictCheckResult>(`/bookings/conflict?${params.toString()}`);
  },
  getSiteOccupancy: (siteId: string, startDate: string, endDate: string) => {
    const params = new URLSearchParams({ siteId, startDate, endDate });
    return request<{ date: string; booking: Booking | null }[]>(`/bookings/occupancy?${params.toString()}`);
  },
  create: (data: CreateBookingRequest) =>
    request<{ booking: Booking; bill: Bill; calculation: CalculationResult }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<{ booking: Booking; message: string }>(`/bookings/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id: string, status: string) =>
    request<Booking>(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const rateApi = {
  getAll: () => request<Rate[]>('/rates'),
  getById: (id: string) => request<Rate>(`/rates/${id}`),
  getBySiteType: (siteType: string) => request<Rate[]>(`/rates/site-type/${siteType}`),
  calculate: (data: {
    checkIn: string;
    checkOut: string;
    siteType: string;
    hasElectricity: boolean;
    hasWater: boolean;
    hasSewer: boolean;
  }) => request<CalculationResult>('/rates/calculate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: CreateRateRequest) =>
    request<Rate>('/rates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateRateRequest>) =>
    request<Rate>(`/rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/rates/${id}`, { method: 'DELETE' }),
};

export const billApi = {
  getAll: () => request<(Bill & { customerName: string; siteName: string })[]>('/bills'),
  getById: (id: string) => request<Bill & { customerName: string; siteName: string; items: BillItem[] }>(`/bills/${id}`),
  pay: (id: string) => request<Bill>(`/bills/${id}/pay`, { method: 'PUT' }),
  refund: (id: string) => request<Bill>(`/bills/${id}/refund`, { method: 'PUT' }),
};

export const dashboardApi = {
  getStats: () => request<DashboardStats>('/dashboard/stats'),
  getTimeline: () => request<(Booking & { eventType: 'check-in' | 'check-out' })[]>('/dashboard/timeline'),
  getUpcoming: (days?: number) => {
    const params = days ? new URLSearchParams({ days: days.toString() }) : '';
    return request<Booking[]>(`/dashboard/upcoming${params ? `?${params.toString()}` : ''}`);
  },
};
