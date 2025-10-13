import React, { useState } from 'react';
import { View } from 'react-native';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import { User } from '../types/User';

interface CartNavigationProps {
  user: User;
  token: string;
  onNavigateToEcommerce?: () => void;
}

export type CartNavigationScreen = 'cart' | 'checkout';

const CartNavigation: React.FC<CartNavigationProps> = ({ user, token, onNavigateToEcommerce }) => {
  const [currentScreen, setCurrentScreen] = useState<CartNavigationScreen>('cart');

  const handleNavigateToCheckout = () => {
    setCurrentScreen('checkout');
  };

  const handleBackToCart = () => {
    setCurrentScreen('cart');
  };

  const handlePaymentSuccess = () => {
    // Navigate back to cart or main screen
    setCurrentScreen('cart');
  };

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'cart' && (
        <CartScreen
          user={user}
          token={token}
          onNavigateToCheckout={handleNavigateToCheckout}
          onNavigateToEcommerce={onNavigateToEcommerce}
        />
      )}
      {currentScreen === 'checkout' && (
        <CheckoutScreen
          user={user}
          onBack={handleBackToCart}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </View>
  );
};

export default CartNavigation;
