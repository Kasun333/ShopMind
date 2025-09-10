import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodayRevenue, MonthlyRevenue } from './revenueService';

// Cache keys
const CACHE_KEYS = {
  TODAY_REVENUE: 'storekeeper_today_revenue',
  MONTHLY_REVENUE: 'storekeeper_monthly_revenue',
  PROCESSED_ORDERS: 'storekeeper_processed_orders',
  CONFIRMED_ORDERS: 'storekeeper_confirmed_orders',
  LAST_UPDATE: 'storekeeper_last_update',
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export interface CachedDashboardData {
  todayRevenue: TodayRevenue | null;
  monthlyRevenue: MonthlyRevenue[] | null;
  processedOrdersCount: number | null;
  confirmedOrdersCount: number | null;
  lastUpdated: string | null;
}

export class DashboardCacheService {
  
  // Check if cache is still valid
  static async isCacheValid(): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!lastUpdate) return false;
      
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const now = new Date().getTime();
      
      return (now - lastUpdateTime) < CACHE_DURATION;
    } catch (error) {
      console.error('❌ Failed to check cache validity:', error);
      return false;
    }
  }

  // Save dashboard data to cache
  static async cacheDashboardData(data: CachedDashboardData): Promise<void> {
    try {
      const cachePromises = [
        AsyncStorage.setItem(CACHE_KEYS.TODAY_REVENUE, JSON.stringify(data.todayRevenue)),
        AsyncStorage.setItem(CACHE_KEYS.MONTHLY_REVENUE, JSON.stringify(data.monthlyRevenue)),
        AsyncStorage.setItem(CACHE_KEYS.PROCESSED_ORDERS, JSON.stringify(data.processedOrdersCount)),
        AsyncStorage.setItem(CACHE_KEYS.CONFIRMED_ORDERS, JSON.stringify(data.confirmedOrdersCount)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString()),
      ];

      await Promise.all(cachePromises);
      console.log('✅ Dashboard data cached successfully');
    } catch (error) {
      console.error('❌ Failed to cache dashboard data:', error);
    }
  }

  // Load dashboard data from cache
  static async getCachedDashboardData(): Promise<CachedDashboardData | null> {
    try {
      const isValid = await this.isCacheValid();
      if (!isValid) {
        console.log('📦 Cache expired, returning null');
        return null;
      }

      const [todayRevenue, monthlyRevenue, processedOrders, confirmedOrders, lastUpdate] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.TODAY_REVENUE),
        AsyncStorage.getItem(CACHE_KEYS.MONTHLY_REVENUE),
        AsyncStorage.getItem(CACHE_KEYS.PROCESSED_ORDERS),
        AsyncStorage.getItem(CACHE_KEYS.CONFIRMED_ORDERS),
        AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE),
      ]);

      const cachedData: CachedDashboardData = {
        todayRevenue: todayRevenue ? JSON.parse(todayRevenue) : null,
        monthlyRevenue: monthlyRevenue ? JSON.parse(monthlyRevenue) : null,
        processedOrdersCount: processedOrders ? JSON.parse(processedOrders) : null,
        confirmedOrdersCount: confirmedOrders ? JSON.parse(confirmedOrders) : null,
        lastUpdated: lastUpdate,
      };

      console.log('✅ Dashboard data loaded from cache');
      return cachedData;
    } catch (error) {
      console.error('❌ Failed to load cached dashboard data:', error);
      return null;
    }
  }

  // Clear all cached data
  static async clearCache(): Promise<void> {
    try {
      const clearPromises = Object.values(CACHE_KEYS).map(key => 
        AsyncStorage.removeItem(key)
      );
      
      await Promise.all(clearPromises);
      console.log('✅ Dashboard cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear dashboard cache:', error);
    }
  }

  // Get cache info for debugging
  static async getCacheInfo(): Promise<{ isValid: boolean; lastUpdate: string | null }> {
    try {
      const isValid = await this.isCacheValid();
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      
      return { isValid, lastUpdate };
    } catch (error) {
      console.error('❌ Failed to get cache info:', error);
      return { isValid: false, lastUpdate: null };
    }
  }
}

export default DashboardCacheService;
