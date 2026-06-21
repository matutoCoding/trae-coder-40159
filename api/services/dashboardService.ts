import { siteDal, bookingDal, billDal } from '../db/dal';
import type { DashboardStats } from '../../shared/types';

export const dashboardService = {
  getStats(): DashboardStats {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const allBookings = bookingDal.getAll();
    const allSites = siteDal.getAll();
    const allBills = billDal.getAll();

    const todayCheckIns = allBookings.filter(
      b => b.checkIn === today && b.status !== 'cancelled'
    ).length;

    const todayCheckOuts = allBookings.filter(
      b => b.checkOut === today && b.status !== 'cancelled'
    ).length;

    const currentlyOccupied = allBookings.filter(
      b => b.checkIn <= today && b.checkOut > today && 
           b.status !== 'cancelled' && b.status !== 'checked-out'
    ).length;

    const pendingBookings = allBookings.filter(
      b => b.status === 'confirmed' && b.checkIn > today
    ).length;

    const occupiedSites = new Set(
      allBookings
        .filter(b => b.checkIn <= today && b.checkOut > today && b.status !== 'cancelled' && b.status !== 'checked-out')
        .map(b => b.siteId)
    ).size;

    const totalSites = allSites.filter(s => s.status === 'available').length;
    const occupancyRate = totalSites > 0 ? Math.round((occupiedSites / totalSites) * 100) : 0;

    const todayRevenue = allBills
      .filter(b => b.status === 'paid' && b.createdAt.startsWith(today))
      .reduce((sum, b) => sum + b.total, 0);

    const monthRevenue = allBills
      .filter(b => b.status === 'paid' && b.createdAt >= monthStartStr && b.createdAt < nextMonthStr)
      .reduce((sum, b) => sum + b.total, 0);

    return {
      todayCheckIns,
      todayCheckOuts,
      occupiedSites,
      totalSites,
      occupancyRate,
      todayRevenue,
      monthRevenue,
      pendingBookings,
    };
  },

  getTodayTimeline() {
    const today = new Date().toISOString().split('T')[0];
    const bookings = bookingDal.getAll();
    
    const todayEvents = bookings
      .filter(b => 
        (b.checkIn === today || b.checkOut === today) && 
        b.status !== 'cancelled'
      )
      .map(b => ({
        ...b,
        eventType: b.checkIn === today ? 'check-in' : 'check-out' as 'check-in' | 'check-out',
      }))
      .sort((a, b) => {
        if (a.eventType === 'check-in' && b.eventType === 'check-out') return -1;
        if (a.eventType === 'check-out' && b.eventType === 'check-in') return 1;
        return a.checkIn.localeCompare(b.checkIn);
      });
    
    return todayEvents;
  },

  getUpcomingBookings(days: number = 7) {
    const today = new Date().toISOString().split('T')[0];
    const limitDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    
    const bookings = bookingDal.getAll()
      .filter(b => 
        b.checkIn >= today && 
        b.checkIn <= limitDate && 
        b.status !== 'cancelled'
      )
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    
    return bookings;
  },
};
