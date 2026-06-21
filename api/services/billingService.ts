import { rateDal, bookingDal, siteDal } from '../db/dal';
import type { Rate, RateSegment, CalculationResult, BillItem } from '../../shared/types';

export const billingService = {
  splitIntoRateSegments(
    checkIn: string,
    checkOut: string,
    siteType: string
  ): RateSegment[] {
    const applicableRates = rateDal.getApplicableRates(siteType, checkIn, checkOut);
    const segments: RateSegment[] = [];
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    let currentDate = new Date(checkInDate);
    
    while (currentDate < checkOutDate) {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      let applicableRate: Rate | null = null;
      let minEndDate = new Date(checkOutDate);
      
      for (const rate of applicableRates) {
        const rateStart = new Date(rate.startDate);
        const rateEnd = new Date(rate.endDate);
        rateEnd.setDate(rateEnd.getDate() + 1);
        
        if (currentDate >= rateStart && currentDate < rateEnd) {
          applicableRate = rate;
          if (rateEnd < minEndDate) {
            minEndDate = rateEnd;
          }
          break;
        }
      }
      
      if (!applicableRate) {
        const defaultRate = applicableRates.find(r => r.type === 'normal') || applicableRates[0];
        if (!defaultRate) {
          throw new Error(`No rate found for site type ${siteType} on ${currentDateStr}`);
        }
        applicableRate = defaultRate;
      }
      
      const segmentEnd = new Date(Math.min(minEndDate.getTime(), checkOutDate.getTime()));
      const days = Math.ceil((segmentEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      segments.push({
        rate: applicableRate,
        startDate: currentDate.toISOString().split('T')[0],
        endDate: segmentEnd.toISOString().split('T')[0],
        days: days,
      });
      
      currentDate = new Date(segmentEnd);
    }
    
    return segments;
  },

  calculateBooking(
    checkIn: string,
    checkOut: string,
    siteType: string,
    hasElectricity: boolean,
    hasWater: boolean,
    hasSewer: boolean
  ): CalculationResult {
    const segments = this.splitIntoRateSegments(checkIn, checkOut, siteType);
    
    let siteFee = 0;
    let totalDays = 0;
    
    const site = siteDal.getAll().find(s => s.type === siteType);
    const sampleRate = segments.length > 0 ? segments[0].rate : null;
    
    for (const segment of segments) {
      siteFee += segment.rate.pricePerDay * segment.days;
      totalDays += segment.days;
    }
    
    const electricityFee = hasElectricity && sampleRate ? sampleRate.electricityRate * totalDays : 0;
    const waterFee = hasWater && sampleRate ? sampleRate.waterRate * totalDays : 0;
    const sewerFee = hasSewer && sampleRate ? sampleRate.sewerRate * totalDays : 0;
    
    const subtotal = siteFee;
    const total = subtotal + electricityFee + waterFee + sewerFee;
    
    return {
      segments,
      siteFee,
      electricityFee,
      waterFee,
      sewerFee,
      subtotal,
      total,
      totalDays,
    };
  },

  generateBillItems(calculation: CalculationResult): Omit<BillItem, 'id'>[] {
    const items: Omit<BillItem, 'id'>[] = [];
    
    for (const segment of calculation.segments) {
      const rateTypeName = this.getRateTypeName(segment.rate.type);
      items.push({
        description: `${rateTypeName} - ${segment.rate.name}`,
        type: 'site_fee',
        quantity: segment.days,
        unitPrice: segment.rate.pricePerDay,
        amount: segment.rate.pricePerDay * segment.days,
        period: `${segment.startDate} 至 ${segment.endDate}`,
      });
    }
    
    if (calculation.electricityFee > 0) {
      const electricityRate = calculation.segments[0]?.rate.electricityRate || 0;
      items.push({
        description: '电力接驳费',
        type: 'electricity',
        quantity: calculation.totalDays,
        unitPrice: electricityRate,
        amount: calculation.electricityFee,
      });
    }
    
    if (calculation.waterFee > 0) {
      const waterRate = calculation.segments[0]?.rate.waterRate || 0;
      items.push({
        description: '供水接驳费',
        type: 'water',
        quantity: calculation.totalDays,
        unitPrice: waterRate,
        amount: calculation.waterFee,
      });
    }
    
    if (calculation.sewerFee > 0) {
      const sewerRate = calculation.segments[0]?.rate.sewerRate || 0;
      items.push({
        description: '排污接驳费',
        type: 'sewer',
        quantity: calculation.totalDays,
        unitPrice: sewerRate,
        amount: calculation.sewerFee,
      });
    }
    
    return items;
  },

  getRateTypeName(type: string): string {
    const names: Record<string, string> = {
      'peak': '旺季',
      'normal': '平季',
      'off-peak': '淡季',
    };
    return names[type] || type;
  },

  getSiteTypeName(type: string): string {
    const names: Record<string, string> = {
      'standard': '标准营位',
      'premium': '高级营位',
      'vip': 'VIP营位',
    };
    return names[type] || type;
  },
};
