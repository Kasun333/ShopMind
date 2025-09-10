import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/apiConfig';

// Product interface for barcode scan
export interface ScannedProduct {
  productId: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  barcode: string;
  categoryName: string;
}

// Restock response interface
export interface RestockResponse {
  success: boolean;
  message: string;
  productId: number;
  quantityAdded: number;
  newPhysicalStock: number;
  newReservedStock: number;
  newAvailableStock: number;
  productName: string;
  restockedAt: string;
}

// API response interfaces
interface ProductBarcodeResponse {
  success: boolean;
  message: string;
  product: ScannedProduct;
}

interface ProductRestockResponse extends RestockResponse {}

class RestockService {
  private baseUrl = API_CONFIG.ECOMMERCE_SERVICE.BASE_URL;

  /**
   * Get product details by barcode
   * @param barcode - Product barcode to scan
   * @param token - Authentication token
   */
  async getProductByBarcode(barcode: string, token: string): Promise<ScannedProduct | null> {
    try {
      console.log('🔍 Scanning barcode:', barcode);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      const url = `${this.baseUrl}/api/products/barcode/${encodeURIComponent(barcode)}`;
      console.log('📡 Request URL:', url);
      console.log('🌐 Base URL:', this.baseUrl);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('📋 Request headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('📱 Barcode scan response status:', response.status);
      console.log('📱 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Barcode scan failed:', response.status, errorText);
        throw new Error(`Failed to scan barcode: ${response.status}`);
      }

      const data: ProductBarcodeResponse = await response.json();
      console.log('✅ Barcode scan response:', data);

      if (data.success && data.product) {
        console.log('🎯 Product found:', data.product);
        return data.product;
      } else {
        console.warn('⚠️ Product not found for barcode:', barcode);
        return null;
      }

    } catch (error) {
      console.error('❌ Error scanning barcode:', error);
      throw error;
    }
  }

  /**
   * Restock product by ID
   * @param productId - Product ID to restock
   * @param quantity - Quantity to add to stock
   * @param token - Authentication token
   */
  async restockProduct(productId: number, quantity: number, token: string): Promise<RestockResponse | null> {
    try {
      console.log('📦 Restocking product:', { productId, quantity });
      
      const url = `${this.baseUrl}/api/products/${productId}/restock/${quantity}`;
      console.log('📡 Restock URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📦 Restock response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Restock failed:', response.status, errorText);
        throw new Error(`Failed to restock product: ${response.status}`);
      }

      const data: ProductRestockResponse = await response.json();
      console.log('✅ Restock response:', data);

      if (data.success) {
        console.log('🎉 Product restocked successfully:', {
          productName: data.productName,
          quantityAdded: data.quantityAdded,
          newAvailableStock: data.newAvailableStock
        });
        return data;
      } else {
        console.warn('⚠️ Restock operation failed:', data.message);
        return null;
      }

    } catch (error) {
      console.error('❌ Error restocking product:', error);
      throw error;
    }
  }

  /**
   * Validate barcode format
   * @param barcode - Barcode to validate
   */
  validateBarcode(barcode: string): boolean {
    // Basic validation - more flexible approach
    if (!barcode || barcode.trim().length === 0) {
      return false;
    }
    
    const trimmedBarcode = barcode.trim();
    
    // Accept various barcode formats:
    // 1. PRD-YYYYMMDDHHMMSS-username (your product format)
    // 2. Any string with at least 3 characters (for testing)
    
    if (trimmedBarcode.length < 3) {
      return false;
    }
    
    // Check if it matches your product barcode format (PRD-YYYYMMDDHHMMSS-username)
    const productBarcodePattern = /^PRD-\d{14}-.+$/;
    if (productBarcodePattern.test(trimmedBarcode)) {
      return true;
    }
    
    // Allow other barcode formats for flexibility (UPC, EAN, etc.)
    // This allows manual testing with simple barcodes
    return trimmedBarcode.length >= 3 && trimmedBarcode.length <= 50;
  }

  /**
   * Format barcode for display
   * @param barcode - Barcode to format
   */
  formatBarcodeDisplay(barcode: string): string {
    if (!barcode) return '';
    
    // If it's a long barcode, show first and last parts
    if (barcode.length > 20) {
      return `${barcode.substring(0, 10)}...${barcode.substring(barcode.length - 8)}`;
    }
    
    return barcode;
  }

  /**
   * Get restock history (if needed for future features)
   */
  async getRestockHistory(productId: number, token: string): Promise<any[]> {
    // This can be implemented when the backend provides restock history endpoint
    console.log('📊 Restock history requested for product:', productId);
    return [];
  }
}

export default new RestockService();
