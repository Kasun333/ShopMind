import { REVENUE_ENDPOINTS, ORDER_COUNT_ENDPOINTS } from '../config/apiConfig';

// Revenue interfaces
export interface TodayRevenue {
  date: string;
  revenue: number;
  currency: string;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  currency: string;
  count: number;
}

// Order count interfaces
export interface OrderCountResponse {
  success: boolean;
  status: string;
  retrievedAt: string;
  count: number;
  message: string;
}

export class RevenueService {
  
  // Get today's revenue
  static async getTodayRevenue(token: string): Promise<TodayRevenue | null> {
    try {
      console.log('📊 Fetching today\'s revenue...');
      
      const response = await fetch(REVENUE_ENDPOINTS.TODAY, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Today\'s revenue fetched successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch today\'s revenue:', error);
      return null;
    }
  }

  // Get monthly revenue data
  static async getMonthlyRevenue(token: string): Promise<MonthlyRevenue[] | null> {
    try {
      console.log('📈 Fetching monthly revenue...');
      
      const response = await fetch(REVENUE_ENDPOINTS.MONTHLY, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Monthly revenue fetched successfully:', data.length, 'months');
      
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch monthly revenue:', error);
      return null;
    }
  }

  // Calculate current month revenue from monthly data
  static getCurrentMonthRevenue(monthlyData: MonthlyRevenue[]): MonthlyRevenue | null {
    if (!monthlyData || monthlyData.length === 0) return null;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();
    return monthlyData.find(month => month.month === currentMonth) || null;
  }

  // Calculate total revenue for the year
  static getTotalYearRevenue(monthlyData: MonthlyRevenue[]): number {
    if (!monthlyData || monthlyData.length === 0) return 0;
    
    return monthlyData.reduce((total, month) => total + month.revenue, 0);
  }

  // Get revenue growth compared to previous month
  static getMonthlyGrowth(monthlyData: MonthlyRevenue[]): number | null {
    if (!monthlyData || monthlyData.length < 2) return null;
    
    const currentMonth = new Date().getMonth(); // 0-11
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                   'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const currentMonthName = months[currentMonth];
    const previousMonthName = months[currentMonth === 0 ? 11 : currentMonth - 1];
    
    const currentMonthData = monthlyData.find(m => m.month === currentMonthName);
    const previousMonthData = monthlyData.find(m => m.month === previousMonthName);
    
    if (!currentMonthData || !previousMonthData) return null;
    
    const growth = ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100;
    return Math.round(growth * 100) / 100; // Round to 2 decimal places
  }

  // Get processed orders count
  static async getProcessedOrdersCount(token: string): Promise<number | null> {
    try {
      console.log('📦 Fetching processed orders count...');
      
      const response = await fetch(ORDER_COUNT_ENDPOINTS.PROCESSED, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrderCountResponse = await response.json();
      console.log('✅ Processed orders count fetched:', data.count);
      
      return data.success ? data.count : null;
    } catch (error) {
      console.error('❌ Failed to fetch processed orders count:', error);
      return null;
    }
  }

  // Get confirmed orders count
  static async getConfirmedOrdersCount(token: string): Promise<number | null> {
    try {
      console.log('📋 Fetching confirmed orders count...');
      
      const response = await fetch(ORDER_COUNT_ENDPOINTS.CONFIRMED, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrderCountResponse = await response.json();
      console.log('✅ Confirmed orders count fetched:', data.count);
      
      return data.success ? data.count : null;
    } catch (error) {
      console.error('❌ Failed to fetch confirmed orders count:', error);
      return null;
    }
  }

  // Format currency
  static formatCurrency(amount: number, currency: string = 'usd'): string {
    const currencySymbols = {
      usd: '$',
      eur: '€',
      gbp: '£',
      lkr: 'Rs.',
    };
    
    const symbol = currencySymbols[currency.toLowerCase() as keyof typeof currencySymbols] || '$';
    
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}

export default RevenueService;
