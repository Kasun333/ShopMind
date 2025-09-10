import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../types/Order';

export interface CachedOrdersData {
  confirmedOrders: Order[];
  processedOrders: Order[];
  lastUpdated: string;
}

class OrdersCacheService {
  private readonly CACHE_KEY = 'storekeeper_orders_cache';
  private readonly CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for orders (shorter than dashboard)

  /**
   * Cache orders data
   */
  async cacheOrdersData(data: Partial<CachedOrdersData>): Promise<void> {
    try {
      // Get existing cache first
      const existingCache = await this.getCachedOrdersData();
      
      // Merge with new data
      const cacheData: CachedOrdersData = {
        confirmedOrders: data.confirmedOrders || existingCache?.confirmedOrders || [],
        processedOrders: data.processedOrders || existingCache?.processedOrders || [],
        lastUpdated: new Date().toISOString()
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('📦 Orders cached successfully:', {
        confirmed: cacheData.confirmedOrders.length,
        processed: cacheData.processedOrders.length,
        timestamp: cacheData.lastUpdated
      });
    } catch (error) {
      console.error('❌ Failed to cache orders data:', error);
    }
  }

  /**
   * Get cached orders data if still valid
   */
  async getCachedOrdersData(): Promise<CachedOrdersData | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      
      if (!cachedData) {
        console.log('📦 No cached orders data found');
        return null;
      }

      const parsed: CachedOrdersData = JSON.parse(cachedData);
      
      if (this.isCacheValid(parsed.lastUpdated)) {
        console.log('✅ Valid cached orders data found:', {
          confirmed: parsed.confirmedOrders.length,
          processed: parsed.processedOrders.length,
          age: this.getCacheAge(parsed.lastUpdated)
        });
        return parsed;
      } else {
        console.log('⏰ Cached orders data expired, removing...');
        await this.clearCache();
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get cached orders data:', error);
      return null;
    }
  }

  /**
   * Get cached orders for a specific status
   */
  async getCachedOrdersByStatus(status: 'CONFIRMED' | 'PROCESSED'): Promise<Order[] | null> {
    const cachedData = await this.getCachedOrdersData();
    
    if (!cachedData) {
      return null;
    }

    return status === 'CONFIRMED' ? cachedData.confirmedOrders : cachedData.processedOrders;
  }

  /**
   * Cache orders for a specific status
   */
  async cacheOrdersByStatus(status: 'CONFIRMED' | 'PROCESSED', orders: Order[]): Promise<void> {
    const updateData = status === 'CONFIRMED' 
      ? { confirmedOrders: orders }
      : { processedOrders: orders };
    
    await this.cacheOrdersData(updateData);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastUpdated: string): boolean {
    const cacheTime = new Date(lastUpdated).getTime();
    const currentTime = new Date().getTime();
    const isValid = (currentTime - cacheTime) < this.CACHE_DURATION;
    
    console.log('🕐 Cache validity check:', {
      cacheTime: new Date(lastUpdated).toLocaleTimeString(),
      currentTime: new Date().toLocaleTimeString(),
      ageMinutes: Math.round((currentTime - cacheTime) / (60 * 1000)),
      maxMinutes: Math.round(this.CACHE_DURATION / (60 * 1000)),
      isValid
    });
    
    return isValid;
  }

  /**
   * Get cache age in human readable format
   */
  private getCacheAge(lastUpdated: string): string {
    const cacheTime = new Date(lastUpdated).getTime();
    const currentTime = new Date().getTime();
    const ageMinutes = Math.round((currentTime - cacheTime) / (60 * 1000));
    
    if (ageMinutes < 1) {
      return 'less than a minute';
    } else if (ageMinutes === 1) {
      return '1 minute';
    } else {
      return `${ageMinutes} minutes`;
    }
  }

  /**
   * Clear all cached orders data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Orders cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear orders cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    hasCache: boolean;
    isValid: boolean;
    age: string;
    confirmedCount: number;
    processedCount: number;
  } | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      
      if (!cachedData) {
        return {
          hasCache: false,
          isValid: false,
          age: 'No cache',
          confirmedCount: 0,
          processedCount: 0
        };
      }

      const parsed: CachedOrdersData = JSON.parse(cachedData);
      const isValid = this.isCacheValid(parsed.lastUpdated);
      
      return {
        hasCache: true,
        isValid,
        age: this.getCacheAge(parsed.lastUpdated),
        confirmedCount: parsed.confirmedOrders.length,
        processedCount: parsed.processedOrders.length
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }
}

const ordersCacheService = new OrdersCacheService();
export default ordersCacheService;
