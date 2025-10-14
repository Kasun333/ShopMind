import { DISCOUNT_ENDPOINTS } from '../config/apiConfig';
import {
  Discount,
  DiscountType,
  DiscountValidationRequest,
  DiscountValidationResponse,
  DiscountApplicationRequest,
  DiscountApplicationResponse,
  UserDiscountHistoryResponse,
  UserSavingsSummary,
  DiscountDetailsResponse,
} from '../types/Discount';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class DiscountService {
  /**
   * Get all active discounts
   * @param type - Optional filter by discount type (BILL_DISCOUNT or PRODUCT_DISCOUNT)
   * @returns Promise<Discount[]>
   */
  async getActiveDiscounts(type?: DiscountType): Promise<Discount[]> {
    try {
      let url = DISCOUNT_ENDPOINTS.GET_ACTIVE;
      if (type) {
        url += `?type=${type}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both array response and wrapped response
      if (Array.isArray(data)) {
        return data;
      } else if (data.success && data.data) {
        return data.data;
      } else {
        return data; // Fallback for direct array response
      }
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      throw error;
    }
  }

  /**
   * Validate a discount code before applying it
   * @param request - Discount validation request
   * @returns Promise<DiscountValidationResponse>
   */
  async validateDiscount(request: DiscountValidationRequest): Promise<DiscountValidationResponse> {
    try {
      console.log('🔍 Validating discount...');
      console.log('API Endpoint:', DISCOUNT_ENDPOINTS.VALIDATE);
      console.log('Request:', JSON.stringify(request, null, 2));

      const response = await fetch(DISCOUNT_ENDPOINTS.VALIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      // Handle wrapped response
      if (data.success !== undefined) {
        return data.data || data;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error validating discount:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Apply a discount to an order
   * @param request - Discount application request
   * @returns Promise<DiscountApplicationResponse>
   */
  async applyDiscount(request: DiscountApplicationRequest): Promise<DiscountApplicationResponse> {
    try {
      console.log('💳 Applying discount...');
      console.log('API Endpoint:', DISCOUNT_ENDPOINTS.APPLY);
      console.log('Request:', JSON.stringify(request, null, 2));

      const response = await fetch(DISCOUNT_ENDPOINTS.APPLY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      // Handle wrapped response
      if (data.success !== undefined) {
        return data.data || data;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error applying discount:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get user's discount history
   * @param userId - User ID
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 10)
   * @returns Promise<UserDiscountHistoryResponse>
   */
  async getUserDiscountHistory(
    userId: number, 
    page: number = 0, 
    size: number = 10
  ): Promise<UserDiscountHistoryResponse> {
    try {
      const url = `${DISCOUNT_ENDPOINTS.HISTORY(userId)}?page=${page}&size=${size}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle wrapped response
      if (data.success !== undefined) {
        return data.data || data;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user discount history:', error);
      throw error;
    }
  }

  /**
   * Get user's savings summary
   * @param userId - User ID
   * @param startDate - Start date (optional, format: YYYY-MM-DD)
   * @param endDate - End date (optional, format: YYYY-MM-DD)
   * @returns Promise<UserSavingsSummary>
   */
  async getUserSavingsSummary(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<UserSavingsSummary> {
    try {
      let url = DISCOUNT_ENDPOINTS.SAVINGS(userId);
      
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle wrapped response
      if (data.success !== undefined) {
        return data.data || data;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user savings summary:', error);
      throw error;
    }
  }

  /**
   * Calculate discount for a given cart
   * @param orderAmount - Total order amount
   * @param productIds - Array of product IDs in the cart
   * @param discountCode - Discount code to apply
   * @param userId - User ID
   * @returns Promise<DiscountValidationResponse>
   */
  async calculateCartDiscount(
    orderAmount: number,
    productIds: number[],
    discountCode: string,
    userId: number
  ): Promise<DiscountValidationResponse> {
    const request: DiscountValidationRequest = {
      discountCode,
      userId,
      orderAmount,
      productIds,
    };

    return this.validateDiscount(request);
  }

  /**
   * Get applicable discounts for current cart
   * @param orderAmount - Total order amount
   * @param productIds - Array of product IDs in the cart
   * @returns Promise<Discount[]>
   */
  async getApplicableDiscounts(
    orderAmount: number,
    productIds: number[]
  ): Promise<Discount[]> {
    try {
      const allDiscounts = await this.getActiveDiscounts();
      
      // Filter discounts based on minimum order amount and product applicability
      const applicableDiscounts = allDiscounts.filter(discount => {
        // Check minimum order amount
        if (orderAmount < discount.minOrderAmount) {
          return false;
        }

        // If it's a product-specific discount, check if any cart products are eligible
        if (discount.type === DiscountType.PRODUCT_DISCOUNT && discount.productIds) {
          return discount.productIds.some(productId => productIds.includes(productId));
        }

        // Bill discounts are always applicable if minimum order amount is met
        return true;
      });

      return applicableDiscounts;
    } catch (error) {
      console.error('Error getting applicable discounts:', error);
      return [];
    }
  }

  /**
   * Format discount for display
   * @param discount - Discount object
   * @returns Formatted discount string
   */
  formatDiscountDisplay(discount: Discount): string {
    if (discount.isPercentage) {
      return `${discount.discountValue}% OFF`;
    } else {
      return `$${discount.discountValue.toFixed(2)} OFF`;
    }
  }

  /**
   * Check if discount is currently valid
   * @param discount - Discount object
   * @returns boolean
   */
  isDiscountValid(discount: Discount): boolean {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);
    
    return now >= validFrom && now <= validTo;
  }

  /**
   * Calculate potential savings for a discount
   * @param discount - Discount object
   * @param orderAmount - Order amount
   * @returns Calculated discount amount
   */
  calculatePotentialSavings(discount: Discount, orderAmount: number): number {
    if (orderAmount < discount.minOrderAmount) {
      return 0;
    }

    let discountAmount = 0;
    
    if (discount.isPercentage) {
      discountAmount = (orderAmount * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }

    // Apply maximum discount limit if specified
    if (discount.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }

    return discountAmount;
  }

  /**
   * Get detailed information about a specific discount including associated products
   * @param discountId - Discount ID
   * @returns Promise<DiscountDetailsResponse>
   */
  async getDiscountDetails(discountId: number): Promise<DiscountDetailsResponse> {
    try {
      const response = await fetch(DISCOUNT_ENDPOINTS.GET_DETAILS(discountId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle wrapped response
      if (data.success !== undefined) {
        return data.data || data;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching discount details:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const discountService = new DiscountService();
export default discountService;