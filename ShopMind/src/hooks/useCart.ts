import { useState, useEffect } from 'react';
import { cartService, CartItem, CartSummary } from '../services/cartService';
import { Product } from '../types/Product';

export interface UseCartReturn {
  // Cart state
  cartItems: CartItem[];
  cartSummary: CartSummary;
  isLoading: boolean;

  // Cart actions
  addToCart: (product: Product, quantity?: number) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<void>;

  // Utility functions
  isProductInCart: (productId: number) => boolean;
  getProductQuantityInCart: (productId: number) => number;
  getCartItemCount: () => number;
}

export const useCart = (): UseCartReturn => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to cart changes
  useEffect(() => {
    // Initialize with current cart items
    const initializeCart = async () => {
      const items = await cartService.getCartItems();
      setCartItems(items);
    };
    
    initializeCart();

    // Subscribe to changes
    const unsubscribe = cartService.subscribe((items) => {
      setCartItems(items);
    });

    return unsubscribe;
  }, []);

  // Add to cart with loading state and error handling
  const addToCart = async (product: Product, quantity: number = 1): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const result = await cartService.addToCart(product, quantity);
      return result;
    } catch (error) {
      console.error('Error in addToCart hook:', error);
      return { success: false, message: 'Failed to add item to cart' };
    } finally {
      setIsLoading(false);
    }
  };

  // Remove from cart
  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    return await cartService.removeFromCart(cartItemId);
  };

  // Update quantity
  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    return await cartService.updateQuantity(cartItemId, newQuantity);
  };

  // Clear cart
  const clearCart = async (): Promise<void> => {
    await cartService.clearCart();
  };

  // Check if product is in cart
  const isProductInCart = (productId: number): boolean => {
    return cartService.isProductInCart(productId);
  };

  // Get quantity of product in cart
  const getProductQuantityInCart = (productId: number): number => {
    return cartService.getProductQuantityInCart(productId);
  };

  // Get total item count for badge
  const getCartItemCount = (): number => {
    return cartService.getCartItemCount();
  };

  // Calculate cart summary
  const cartSummary = cartService.getCartSummary();

  return {
    // State
    cartItems,
    cartSummary,
    isLoading,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,

    // Utilities
    isProductInCart,
    getProductQuantityInCart,
    getCartItemCount,
  };
};
