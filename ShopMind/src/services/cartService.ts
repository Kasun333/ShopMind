import { Product } from '../types/Product';
import { CartSummaryWithDiscount, Discount } from '../types/Discount';
import { discountService } from './discountService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using AsyncStorage for persistent storage
const storage = AsyncStorage;

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

class CartService {
  private cartItems: CartItem[] = [];
  private listeners: Array<(items: CartItem[]) => void> = [];
  private isInitialized = false;
  private readonly STORAGE_KEY = 'cart_items';
  private appliedDiscount: Discount | null = null;
  private discountAmount: number = 0;

  constructor() {
    this.initializeCart();
  }

  // Initialize cart from storage
  private async initializeCart() {
    try {
      const storedItems = await storage.getItem(this.STORAGE_KEY);
      if (storedItems) {
        this.cartItems = JSON.parse(storedItems);
        console.log('Cart loaded from storage:', this.cartItems.length, 'items');
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    } finally {
      this.isInitialized = true;
      this.notifyListeners();
    }
  }

  // Save cart to storage
  private async saveToStorage() {
    try {
      await storage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems));
      console.log('Cart saved to storage');
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  // Wait for initialization
  private async waitForInitialization() {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Subscribe to cart changes
  subscribe(listener: (items: CartItem[]) => void) {
    this.listeners.push(listener);
    // Send current state immediately if initialized
    if (this.isInitialized) {
      listener([...this.cartItems]);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of cart changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.cartItems]));
  }

  // Add item to cart
  async addToCart(product: Product, quantity: number = 1): Promise<{ success: boolean; message: string }> {
    await this.waitForInitialization();
    
    try {
      // Validate input
      if (!product || quantity <= 0) {
        return { success: false, message: 'Invalid product or quantity' };
      }

      // Ensure productId is defined
      if (!product.productId) {
        console.error('Product missing productId:', product);
        return { success: false, message: 'Product ID is missing' };
      }

      // Check stock availability
      if (product.stock === 0) {
        return { success: false, message: 'Product is out of stock' };
      }

      console.log('Adding to cart:', { productId: product.productId, quantity, currentCartItems: this.cartItems.length });

      // Find existing item in cart
      const existingItemIndex = this.cartItems.findIndex(
        item => item.productId === product.productId
      );

      console.log('Existing item index:', existingItemIndex, 'for productId:', product.productId);

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = this.cartItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Check if new quantity exceeds stock
        if (newQuantity > product.stock) {
          return { 
            success: false, 
            message: `Cannot add ${quantity} more. Only ${product.stock - existingItem.quantity} available.` 
          };
        }

        this.cartItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          stock: product.stock // Update stock info
        };
        
        console.log('Updated existing item quantity to:', newQuantity);
      } else {
        // Add new item
        if (quantity > product.stock) {
          return { 
            success: false, 
            message: `Cannot add ${quantity} items. Only ${product.stock} available.` 
          };
        }

        const cartItem: CartItem = {
          id: `cart_${Date.now()}_${product.productId}`,
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity: quantity,
          imageUrl: product.imageUrl,
          stock: product.stock,
          categoryId: product.categoryId
        };

        this.cartItems.push(cartItem);
        console.log('Added new item to cart:', cartItem);
      }

      await this.saveToStorage();
      this.notifyListeners();
      return { 
        success: true, 
        message: `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to cart!` 
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Failed to add item to cart' };
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<boolean> {
    await this.waitForInitialization();
    
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
    
    if (this.cartItems.length < initialLength) {
      await this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Update item quantity
  async updateQuantity(cartItemId: string, newQuantity: number): Promise<{ success: boolean; message: string }> {
    await this.waitForInitialization();
    
    const itemIndex = this.cartItems.findIndex(item => item.id === cartItemId);
    
    if (itemIndex === -1) {
      return { success: false, message: 'Item not found in cart' };
    }

    const item = this.cartItems[itemIndex];

    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.removeFromCart(cartItemId);
      return { success: true, message: 'Item removed from cart' };
    }

    if (newQuantity > item.stock) {
      return { 
        success: false, 
        message: `Cannot set quantity to ${newQuantity}. Only ${item.stock} available.` 
      };
    }

    this.cartItems[itemIndex] = { ...item, quantity: newQuantity };
    await this.saveToStorage();
    this.notifyListeners();
    return { success: true, message: 'Quantity updated' };
  }

  // Get all cart items
  async getCartItems(): Promise<CartItem[]> {
    await this.waitForInitialization();
    return [...this.cartItems];
  }

  // Get cart summary with calculations
  getCartSummary(): CartSummary {
    const subtotal = this.cartItems.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
    
    const shipping = this.cartItems.length > 0 ? 5.99 : 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    const itemCount = this.cartItems.reduce(
      (count, item) => count + item.quantity, 
      0
    );

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount
    };
  }

  // Get cart summary with discount calculations
  getCartSummaryWithDiscount(): CartSummaryWithDiscount {
    const baseSummary = this.getCartSummary();
    
    return {
      ...baseSummary,
      discountAmount: this.discountAmount,
      total: Math.round((baseSummary.total - this.discountAmount) * 100) / 100,
      appliedDiscount: this.appliedDiscount ? {
        id: this.appliedDiscount.id,
        code: this.appliedDiscount.discountCode,
        name: this.appliedDiscount.discountName,
        amount: this.discountAmount,
      } : undefined,
    };
  }

  // Apply discount to cart
  async applyDiscount(discountCode: string, userId: number): Promise<{ success: boolean; message: string; discountAmount?: number }> {
    try {
      const summary = this.getCartSummary();
      const productIds = this.cartItems.map(item => item.productId);

      console.log('═══════════════════════════════════════════════════════');
      console.log('💰 APPLYING DISCOUNT');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Discount Code:', discountCode);
      console.log('User ID:', userId);
      console.log('Order Amount:', summary.total);
      console.log('Product IDs:', productIds);
      console.log('Request payload:', JSON.stringify({
        discountCode,
        userId,
        orderAmount: summary.total,
        productIds,
      }, null, 2));
      console.log('═══════════════════════════════════════════════════════');

      // Apply discount using the apply endpoint
      const result = await discountService.applyDiscount({
        discountCode,
        userId,
        orderAmount: summary.total,
        productIds,
      });

      console.log('✅ Discount application result:', result);

      if (result.applicable) {
        // Find the discount details
        const activeDiscounts = await discountService.getActiveDiscounts();
        const discount = activeDiscounts.find(d => d.discountCode === discountCode);
        
        this.appliedDiscount = discount || null;
        this.discountAmount = result.discountAmount || 0;
        
        this.notifyListeners();
        
        return {
          success: true,
          message: result.message || 'Discount applied successfully',
          discountAmount: result.discountAmount,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to apply discount',
        };
      }
    } catch (error) {
      console.error('❌ Error applying discount:', error);
      return {
        success: false,
        message: 'Failed to apply discount. Please try again.',
      };
    }
  }

  // Remove applied discount
  removeDiscount(): void {
    this.appliedDiscount = null;
    this.discountAmount = 0;
    this.notifyListeners();
  }

  // Get applied discount info
  getAppliedDiscount(): { discount: Discount | null; amount: number } {
    return {
      discount: this.appliedDiscount,
      amount: this.discountAmount,
    };
  }

  // Get applicable discounts for current cart
  async getApplicableDiscounts(): Promise<Discount[]> {
    try {
      const summary = this.getCartSummary();
      const productIds = this.cartItems.map(item => item.productId);
      
      return await discountService.getApplicableDiscounts(summary.total, productIds);
    } catch (error) {
      console.error('Error getting applicable discounts:', error);
      return [];
    }
  }

  // Clear entire cart
  async clearCart(): Promise<void> {
    await this.waitForInitialization();
    this.cartItems = [];
    this.appliedDiscount = null;
    this.discountAmount = 0;
    await this.saveToStorage();
    this.notifyListeners();
  }

  // Check if product is in cart
  isProductInCart(productId: number): boolean {
    const result = this.cartItems.some(item => item.productId === productId);
    console.log(`Checking if product ${productId} is in cart:`, result, 'Cart items:', this.cartItems.map(item => ({ id: item.id, productId: item.productId, name: item.name })));
    return result;
  }

  // Get quantity of specific product in cart
  getProductQuantityInCart(productId: number): number {
    const item = this.cartItems.find(item => item.productId === productId);
    const quantity = item ? item.quantity : 0;
    console.log(`Getting quantity for product ${productId}:`, quantity);
    return quantity;
  }

  // Get total number of items in cart (for badge)
  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }
}

// Export singleton instance
export const cartService = new CartService();
export default cartService;
