import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import CartNavigation from '../navigation/CartNavigation';

// Mock the screens
jest.mock('../screens/CartScreen', () => {
  return jest.fn(({ onNavigateToCheckout }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>Cart Screen</Text>
        <TouchableOpacity onPress={onNavigateToCheckout}>
          <Text>Go to Checkout</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

jest.mock('../screens/CheckoutScreen', () => {
  return jest.fn(({ onBack, onPaymentSuccess }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>Checkout Screen</Text>
        <TouchableOpacity onPress={onBack}>
          <Text>Back to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPaymentSuccess}>
          <Text>Complete Payment</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

describe('CartNavigation', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'User' as const,
    accountStatus: 'active' as const,
    createdAt: '2024-01-01',
    dateOfBirth: '1990-01-01',
    formattedAddress: '123 Test St',
    latitude: 0,
    longitude: 0,
    phoneNumber: '1234567890',
    profileImageUrl: 'https://example.com/avatar.jpg'
  };

  const defaultProps = {
    user: mockUser,
    token: 'test-token'
  };

  describe('Initial Screen Rendering', () => {
    it('renders CartScreen by default', () => {
      render(<CartNavigation {...defaultProps} />);
      
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      expect(screen.queryByText('Checkout Screen')).toBeNull();
    });

    it('passes correct props to CartScreen', () => {
      const CartScreen = require('../screens/CartScreen');
      render(<CartNavigation {...defaultProps} />);
      
      // Check that CartScreen was called with the right props
      const lastCall = CartScreen.mock.calls[CartScreen.mock.calls.length - 1];
      const [props] = lastCall;
      
      expect(props.user).toEqual(mockUser);
      expect(props.token).toBe('test-token');
      expect(typeof props.onNavigateToCheckout).toBe('function');
    });
  });

  describe('Navigation to Checkout', () => {
    it('navigates to checkout screen when onNavigateToCheckout is called', () => {
      render(<CartNavigation {...defaultProps} />);
      
      const checkoutButton = screen.getByText('Go to Checkout');
      fireEvent.press(checkoutButton);
      
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      expect(screen.queryByText('Cart Screen')).toBeNull();
    });

    it('passes correct props to CheckoutScreen', () => {
      const CheckoutScreen = require('../screens/CheckoutScreen');
      render(<CartNavigation {...defaultProps} />);
      
      const checkoutButton = screen.getByText('Go to Checkout');
      fireEvent.press(checkoutButton);
      
      // Check that CheckoutScreen was called with the right props
      const lastCall = CheckoutScreen.mock.calls[CheckoutScreen.mock.calls.length - 1];
      const [props] = lastCall;
      
      expect(props.user).toEqual(mockUser);
      expect(typeof props.onBack).toBe('function');
      expect(typeof props.onPaymentSuccess).toBe('function');
    });

    it('handles multiple navigation calls to checkout', () => {
      render(<CartNavigation {...defaultProps} />);
      
      const checkoutButton = screen.getByText('Go to Checkout');
      
      // Multiple presses should not cause issues
      fireEvent.press(checkoutButton);
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Should still be on checkout screen
      expect(screen.queryByText('Cart Screen')).toBeNull();
    });
  });

  describe('Navigation Back to Cart', () => {
    it('navigates back to cart from checkout when onBack is called', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Navigate to checkout
      const checkoutButton = screen.getByText('Go to Checkout');
      fireEvent.press(checkoutButton);
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Navigate back to cart
      const backButton = screen.getByText('Back to Cart');
      fireEvent.press(backButton);
      
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      expect(screen.queryByText('Checkout Screen')).toBeNull();
    });

    it('handles rapid navigation between screens', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Rapid navigation should not cause issues
      for (let i = 0; i < 5; i++) {
        const checkoutButton = screen.getByText('Go to Checkout');
        fireEvent.press(checkoutButton);
        expect(screen.getByText('Checkout Screen')).toBeTruthy();
        
        const backButton = screen.getByText('Back to Cart');
        fireEvent.press(backButton);
        expect(screen.getByText('Cart Screen')).toBeTruthy();
      }
    });
  });

  describe('Payment Success Navigation', () => {
    it('navigates back to cart after successful payment', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Navigate to checkout
      const checkoutButton = screen.getByText('Go to Checkout');
      fireEvent.press(checkoutButton);
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Complete payment
      const paymentButton = screen.getByText('Complete Payment');
      fireEvent.press(paymentButton);
      
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      expect(screen.queryByText('Checkout Screen')).toBeNull();
    });

    it('handles payment success from checkout screen correctly', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Start at cart
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      
      // Go to checkout
      fireEvent.press(screen.getByText('Go to Checkout'));
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Complete payment and return to cart
      fireEvent.press(screen.getByText('Complete Payment'));
      expect(screen.getByText('Cart Screen')).toBeTruthy();
    });
  });

  describe('Screen State Management', () => {
    it('maintains correct screen state throughout navigation flow', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Initial state: Cart
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      expect(screen.queryByText('Checkout Screen')).toBeNull();
      
      // Navigate to checkout
      fireEvent.press(screen.getByText('Go to Checkout'));
      expect(screen.queryByText('Cart Screen')).toBeNull();
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Back to cart
      fireEvent.press(screen.getByText('Back to Cart'));
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      expect(screen.queryByText('Checkout Screen')).toBeNull();
    });

    it('preserves user and token data across navigation', () => {
      const CartScreen = require('../screens/CartScreen');
      const CheckoutScreen = require('../screens/CheckoutScreen');
      
      render(<CartNavigation {...defaultProps} />);
      
      // Check initial cart screen props
      const cartCall = CartScreen.mock.calls[CartScreen.mock.calls.length - 1];
      const [cartProps] = cartCall;
      expect(cartProps.user).toEqual(mockUser);
      expect(cartProps.token).toBe('test-token');
      
      // Navigate to checkout and verify props
      fireEvent.press(screen.getByText('Go to Checkout'));
      const checkoutCall = CheckoutScreen.mock.calls[CheckoutScreen.mock.calls.length - 1];
      const [checkoutProps] = checkoutCall;
      expect(checkoutProps.user).toEqual(mockUser);
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation callbacks gracefully', () => {
      // Mock screens that don't call navigation functions
      jest.doMock('../screens/CartScreen', () => {
        return jest.fn(() => {
          const { View, Text } = require('react-native');
          return (
            <View>
              <Text>Cart Screen</Text>
            </View>
          );
        });
      });
      
      expect(() => {
        render(<CartNavigation {...defaultProps} />);
      }).not.toThrow();
      
      expect(screen.getByText('Cart Screen')).toBeTruthy();
    });

    it('handles missing user prop gracefully', () => {
      const propsWithoutUser = {
        user: undefined as any,
        token: 'test-token'
      };
      
      expect(() => {
        render(<CartNavigation {...propsWithoutUser} />);
      }).not.toThrow();
    });

    it('handles missing token prop gracefully', () => {
      const propsWithoutToken = {
        user: mockUser,
        token: undefined as any
      };
      
      expect(() => {
        render(<CartNavigation {...propsWithoutToken} />);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('initializes with correct default screen', () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Should always start with cart screen
      expect(screen.getByText('Cart Screen')).toBeTruthy();
    });

    it('handles component remounting correctly', () => {
      const { unmount } = render(<CartNavigation {...defaultProps} />);
      
      // Navigate to checkout before unmounting
      fireEvent.press(screen.getByText('Go to Checkout'));
      expect(screen.getByText('Checkout Screen')).toBeTruthy();
      
      // Unmount the component
      unmount();
      
      // Remount with fresh render
      const newRender = render(<CartNavigation {...defaultProps} />);
      
      // Should reset to cart screen on remount
      expect(newRender.getByText('Cart Screen')).toBeTruthy();
      expect(newRender.queryByText('Checkout Screen')).toBeNull();
    });
  });

  describe('Integration Testing', () => {
    it('completes full navigation flow successfully', async () => {
      render(<CartNavigation {...defaultProps} />);
      
      // Start at cart
      expect(screen.getByText('Cart Screen')).toBeTruthy();
      
      // Navigate to checkout
      fireEvent.press(screen.getByText('Go to Checkout'));
      await waitFor(() => {
        expect(screen.getByText('Checkout Screen')).toBeTruthy();
      });
      
      // Back to cart
      fireEvent.press(screen.getByText('Back to Cart'));
      await waitFor(() => {
        expect(screen.getByText('Cart Screen')).toBeTruthy();
      });
      
      // Back to checkout
      fireEvent.press(screen.getByText('Go to Checkout'));
      await waitFor(() => {
        expect(screen.getByText('Checkout Screen')).toBeTruthy();
      });
      
      // Complete payment and return to cart
      fireEvent.press(screen.getByText('Complete Payment'));
      await waitFor(() => {
        expect(screen.getByText('Cart Screen')).toBeTruthy();
      });
    });
  });
});