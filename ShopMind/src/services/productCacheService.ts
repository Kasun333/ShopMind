import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/Product';

export interface CachedProductsData {
  products: Product[];
  lastUpdated: string;
  categoryId: number | null;
}

class ProductCacheService {
  private readonly CACHE_KEY_PREFIX = 'products_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Generate cache key based on category
   */
  private getCacheKey(categoryId: number | null): string {
    return categoryId 
      ? `${this.CACHE_KEY_PREFIX}_category_${categoryId}`
      : `${this.CACHE_KEY_PREFIX}_all`;
  }

  /**
   * Cache products data
   */
  async cacheProducts(products: Product[], categoryId: number | null = null): Promise<void> {
    try {
      const cacheData: CachedProductsData = {
        products,
        lastUpdated: new Date().toISOString(),
        categoryId,
      };

      const cacheKey = this.getCacheKey(categoryId);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`📦 Products cached successfully:`, {
        category: categoryId || 'all',
        count: products.length,
        timestamp: cacheData.lastUpdated,
      });
    } catch (error) {
      console.error('❌ Failed to cache products:', error);
    }
  }

  /**
   * Get cached products if still valid
   */
  async getCachedProducts(categoryId: number | null = null): Promise<Product[] | null> {
    try {
      const cacheKey = this.getCacheKey(categoryId);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        console.log('📦 No cached products found for:', categoryId || 'all');
        return null;
      }

      const cache: CachedProductsData = JSON.parse(cachedData);
      const lastUpdated = new Date(cache.lastUpdated);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdated.getTime();

      // Check if cache is still valid (within 5 minutes)
      if (timeDiff < this.CACHE_DURATION) {
        const remainingTime = Math.floor((this.CACHE_DURATION - timeDiff) / 1000);
        console.log(`✅ Using cached products:`, {
          category: categoryId || 'all',
          count: cache.products.length,
          age: `${Math.floor(timeDiff / 1000)}s`,
          remainingTime: `${remainingTime}s`,
        });
        return cache.products;
      } else {
        console.log('⏰ Cache expired for:', categoryId || 'all', `(${Math.floor(timeDiff / 1000)}s old)`);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get cached products:', error);
      return null;
    }
  }

  /**
   * Check if cache is still valid without retrieving data
   */
  async isCacheValid(categoryId: number | null = null): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(categoryId);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return false;

      const cache: CachedProductsData = JSON.parse(cachedData);
      const lastUpdated = new Date(cache.lastUpdated);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdated.getTime();

      return timeDiff < this.CACHE_DURATION;
    } catch (error) {
      console.error('❌ Failed to check cache validity:', error);
      return false;
    }
  }

  /**
   * Get cache age in seconds
   */
  async getCacheAge(categoryId: number | null = null): Promise<number | null> {
    try {
      const cacheKey = this.getCacheKey(categoryId);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;

      const cache: CachedProductsData = JSON.parse(cachedData);
      const lastUpdated = new Date(cache.lastUpdated);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdated.getTime();

      return Math.floor(timeDiff / 1000);
    } catch (error) {
      console.error('❌ Failed to get cache age:', error);
      return null;
    }
  }

  /**
   * Clear cache for specific category or all
   */
  async clearCache(categoryId: number | null = null): Promise<void> {
    try {
      if (categoryId === null) {
        // Clear all product caches
        const keys = await AsyncStorage.getAllKeys();
        const productCacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
        await AsyncStorage.multiRemove(productCacheKeys);
        console.log('🗑️ All product caches cleared');
      } else {
        const cacheKey = this.getCacheKey(categoryId);
        await AsyncStorage.removeItem(cacheKey);
        console.log('🗑️ Cache cleared for category:', categoryId);
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired caches
   */
  async clearExpiredCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const key of productCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const cache: CachedProductsData = JSON.parse(cachedData);
          const lastUpdated = new Date(cache.lastUpdated);
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdated.getTime();

          if (timeDiff >= this.CACHE_DURATION) {
            await AsyncStorage.removeItem(key);
            console.log('🗑️ Expired cache removed:', key);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to clear expired caches:', error);
    }
  }

  /**
   * Get all cached categories info
   */
  async getCacheInfo(): Promise<Array<{ category: string; age: number; count: number }>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      const info = [];
      for (const key of productCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const cache: CachedProductsData = JSON.parse(cachedData);
          const lastUpdated = new Date(cache.lastUpdated);
          const now = new Date();
          const age = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

          info.push({
            category: cache.categoryId?.toString() || 'all',
            age,
            count: cache.products.length,
          });
        }
      }
      
      return info;
    } catch (error) {
      console.error('❌ Failed to get cache info:', error);
      return [];
    }
  }
}

export default new ProductCacheService();
