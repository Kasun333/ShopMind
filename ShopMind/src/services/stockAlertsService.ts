import { STOCK_ALERTS_ENDPOINTS } from '../config/apiConfig';

// Stock Alert interfaces
export interface StockAlert {
  alertId: number;
  productId: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
  message: string;
  createdAt: string;
  resolved: boolean;
}

// Enhanced stock alert with product details (for UI display)
export interface StockAlertWithProduct extends StockAlert {
  productName?: string;
  currentStock?: number;
  threshold?: number;
}

class StockAlertsService {
  /**
   * Get all unresolved stock alerts
   * @param token - Authentication token
   */
  async getStockAlerts(token: string): Promise<StockAlert[]> {
    try {
      console.log('📊 Fetching stock alerts...');
      console.log('📡 Request URL:', STOCK_ALERTS_ENDPOINTS.GET_ALERTS);

      const response = await fetch(STOCK_ALERTS_ENDPOINTS.GET_ALERTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Stock alerts response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch stock alerts:', response.status, errorText);
        throw new Error(`Failed to fetch stock alerts: ${response.status}`);
      }

      const data: StockAlert[] = await response.json();
      console.log('✅ Stock alerts fetched successfully:', data.length, 'alerts');
      
      // Filter only unresolved alerts
      const unresolvedAlerts = data.filter(alert => !alert.resolved);
      console.log('🔍 Unresolved alerts:', unresolvedAlerts.length);
      
      return unresolvedAlerts;

    } catch (error) {
      console.error('❌ Error fetching stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get stock alerts separated by type
   * @param token - Authentication token
   */
  async getCategorizedStockAlerts(token: string): Promise<{
    lowStock: StockAlert[];
    outOfStock: StockAlert[];
    total: number;
  }> {
    try {
      const alerts = await this.getStockAlerts(token);
      
      const lowStock = alerts.filter(alert => alert.alertType === 'LOW_STOCK');
      const outOfStock = alerts.filter(alert => alert.alertType === 'OUT_OF_STOCK');
      
      console.log('📈 Categorized alerts:', {
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        total: alerts.length
      });
      
      return {
        lowStock,
        outOfStock,
        total: alerts.length
      };

    } catch (error) {
      console.error('❌ Error categorizing stock alerts:', error);
      throw error;
    }
  }

  /**
   * Parse stock quantity from alert message
   * @param message - Alert message
   */
  parseStockQuantity(message: string): number | null {
    // Extract quantity from messages like "Product 2 is low on stock (80)"
    const match = message.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Get product name from alert message
   * @param message - Alert message
   */
  parseProductId(message: string): number | null {
    // Extract product ID from messages like "Product 2 is low on stock (80)"
    const match = message.match(/Product (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Format alert for display
   * @param alert - Stock alert to format
   */
  formatAlertForDisplay(alert: StockAlert): StockAlertWithProduct {
    const productId = this.parseProductId(alert.message);
    const currentStock = this.parseStockQuantity(alert.message);
    
    // Generate a product name based on productId (you can enhance this with actual product data)
    const productName = `Product #${productId || alert.productId}`;
    
    return {
      ...alert,
      productName,
      currentStock,
      // Set a default threshold based on alert type
      threshold: alert.alertType === 'LOW_STOCK' ? (currentStock || 0) + 10 : 0
    };
  }

  /**
   * Get inventory stats from stock alerts
   * @param token - Authentication token
   */
  async getInventoryStats(token: string): Promise<{
    totalAlerts: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    try {
      const categorized = await this.getCategorizedStockAlerts(token);
      
      return {
        totalAlerts: categorized.total,
        lowStockCount: categorized.lowStock.length,
        outOfStockCount: categorized.outOfStock.length
      };

    } catch (error) {
      console.error('❌ Error getting inventory stats:', error);
      // Return default values on error
      return {
        totalAlerts: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
  }

  /**
   * Format time since alert was created
   * @param createdAt - ISO date string
   */
  formatTimeSince(createdAt: string): string {
    const alertDate = new Date(createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - alertDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  }
}

export default new StockAlertsService();
