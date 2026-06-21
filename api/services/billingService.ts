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
    let electricityFee = 0;
    let waterFee = 0;
    let sewerFee = 0;
    let totalDays = 0;
    
    for (const segment of segments) {
      siteFee += segment.rate.pricePerDay * segment.days;
      totalDays += segment.days;
      
      if (hasElectricity) {
        electricityFee += segment.rate.electricityRate * segment.days;
      }
      if (hasWater) {
        waterFee += segment.rate.waterRate * segment.days;
      }
      if (hasSewer) {
        sewerFee += segment.rate.sewerRate * segment.days;
      }
    }
    
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
      hasElectricity,
      hasWater,
      hasSewer,
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
    
    for (const segment of calculation.segments) {
      const rateTypeName = this.getRateTypeName(segment.rate.type);
      
      if (calculation.hasElectricity && segment.rate.electricityRate > 0) {
        items.push({
          description: `电力接驳费 - ${rateTypeName}`,
          type: 'electricity',
          quantity: segment.days,
          unitPrice: segment.rate.electricityRate,
          amount: segment.rate.electricityRate * segment.days,
          period: `${segment.startDate} 至 ${segment.endDate}`,
        });
      }
      
      if (calculation.hasWater && segment.rate.waterRate > 0) {
        items.push({
          description: `供水接驳费 - ${rateTypeName}`,
          type: 'water',
          quantity: segment.days,
          unitPrice: segment.rate.waterRate,
          amount: segment.rate.waterRate * segment.days,
          period: `${segment.startDate} 至 ${segment.endDate}`,
        });
      }
      
      if (calculation.hasSewer && segment.rate.sewerRate > 0) {
        items.push({
          description: `排污接驳费 - ${rateTypeName}`,
          type: 'sewer',
          quantity: segment.days,
          unitPrice: segment.rate.sewerRate,
          amount: segment.rate.sewerRate * segment.days,
          period: `${segment.startDate} 至 ${segment.endDate}`,
        });
      }
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
