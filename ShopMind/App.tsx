import React, { useState, useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DriverScreen from './src/screens/DriverScreen';
import EcommerceScreen from './src/screens/EcommerceScreen';
import StoreKeeperScreen from './src/screens/StoreKeeperScreen';
import { User } from './src/types/User';
import { initializeStripe } from './src/services/stripeService';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RruEkCMSVvAbN0Rb1KpfTDO1yPhc7R3BNFALqZTR1G2bggo2w1rSEx78EKBkt8VwRgls5isLAO0OyHyz88FrEtf00JDvUIAap';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);

  useEffect(() => {
    const initStripe = async () => {
      const initialized = await initializeStripe();
      setStripeInitialized(initialized);
      if (!initialized) {
        console.error('Failed to initialize Stripe');
      }
    };
    initStripe();
  }, []);

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowSignup(false);
  };

  const handleShowSignup = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
  };

  // If user is not logged in, show login or signup screen
  if (!user || !token) {
    if (showSignup) {
      return (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <SignupScreen 
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={handleBackToLogin}
          />
        </StripeProvider>
      );
    }
    return (
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <LoginScreen 
          onLogin={handleLogin} 
          onShowSignup={handleShowSignup}
        />
      </StripeProvider>
    );
  }

  // Navigate based on user role
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {(() => {
        switch (user.role) {
          case 'Driver':
            return <DriverScreen user={user} token={token} onLogout={handleLogout} />;
          case 'User':
            return <EcommerceScreen user={user} token={token} onLogout={handleLogout} />;
          case 'Store Keeper':
            return <StoreKeeperScreen user={user} token={token} onLogout={handleLogout} />;
          default:
            // Default to ecommerce screen for unknown roles
            return <EcommerceScreen user={user} token={token} onLogout={handleLogout} />;
        }
      })()}
    </StripeProvider>
  );
}
