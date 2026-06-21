import { bookingDal } from '../db/dal';
import type { ConflictCheckResult, Booking } from '../../shared/types';

export const conflictService = {
  checkConflict(siteId: string, checkIn: string, checkOut: string, excludeId?: string): ConflictCheckResult {
    const conflictingBookings = bookingDal.getConflicting(siteId, checkIn, checkOut, excludeId);
    
    return {
      hasConflict: conflictingBookings.length > 0,
      conflictingBookings,
    };
  },

  checkMultipleConflicts(siteIds: string[], checkIn: string, checkOut: string): Map<string, ConflictCheckResult> {
    const results = new Map<string, ConflictCheckResult>();
    
    for (const siteId of siteIds) {
      results.set(siteId, this.checkConflict(siteId, checkIn, checkOut));
    }
    
    return results;
  },

  getAvailableSites(siteIds: string[], checkIn: string, checkOut: string): string[] {
    const available: string[] = [];
    
    for (const siteId of siteIds) {
      const result = this.checkConflict(siteId, checkIn, checkOut);
      if (!result.hasConflict) {
        available.push(siteId);
      }
    }
    
    return available;
  },

  getSiteOccupancy(siteId: string, startDate: string, endDate: string): { date: string; booking: Booking | null }[] {
    const bookings = bookingDal.getConflicting(siteId, startDate, endDate);
    const occupancy: { date: string; booking: Booking | null }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const booking = bookings.find(b => {
        const bCheckIn = new Date(b.checkIn);
        const bCheckOut = new Date(b.checkOut);
        return currentDate >= bCheckIn && currentDate < bCheckOut;
      }) || null;
      
      occupancy.push({ date: dateStr, booking });
    }
    
    return occupancy;
  },
};
