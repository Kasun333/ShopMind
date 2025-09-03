import { ECOMMERCE_API_URL } from '../config/apiConfig';

export interface InventoryReductionResponse {
  success: boolean;
  message: string;
  remainingStock?: number;
}

export class InventoryService {
  /**
   * Reduce product inventory after successful barcode scan
   * Uses PUT method to update inventory levels
   */
  static async reduceInventory(
    productId: number, 
    quantity: number,
    token: string
  ): Promise<InventoryReductionResponse> {
    try {
      console.log('InventoryService.reduceInventory - Product ID:', productId, 'Quantity:', quantity);
      
      const response = await fetch(
        `${ECOMMERCE_API_URL}/api/products/${productId}/reduce/${quantity}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('InventoryService.reduceInventory - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('InventoryService.reduceInventory - Error response:', errorData);
        return {
          success: false,
          message: `Failed to reduce inventory: ${errorData}`,
        };
      }

      const data = await response.json();
      console.log('InventoryService.reduceInventory - Success response:', data);
      
      return {
        success: true,
        message: data.message || 'Inventory reduced successfully',
        remainingStock: data.remainingStock,
      };
    } catch (error) {
      console.error('InventoryService.reduceInventory - Error:', error);
      return {
        success: false,
        message: 'Could not connect to inventory service',
      };
    }
  }

  /**
   * Batch reduce inventory for multiple products
   */
  static async batchReduceInventory(
    items: Array<{ productId: number; quantity: number }>,
    token: string
  ): Promise<{ success: boolean; message: string; results: InventoryReductionResponse[] }> {
    try {
      console.log('InventoryService.batchReduceInventory - Items:', items);
      
      const results: InventoryReductionResponse[] = [];
      let allSuccess = true;
      
      for (const item of items) {
        if (item.productId) { // Only process items with valid product IDs
          const result = await this.reduceInventory(item.productId, item.quantity, token);
          results.push(result);
          if (!result.success) {
            allSuccess = false;
          }
        } else {
          console.warn('InventoryService.batchReduceInventory - Skipping item with null productId:', item);
          results.push({
            success: false,
            message: 'Product ID is null',
          });
          allSuccess = false;
        }
      }
      
      return {
        success: allSuccess,
        message: allSuccess 
          ? 'All inventory items reduced successfully' 
          : 'Some inventory reductions failed',
        results,
      };
    } catch (error) {
      console.error('InventoryService.batchReduceInventory - Error:', error);
      return {
        success: false,
        message: 'Batch inventory reduction failed',
        results: [],
      };
    }
  }
}
