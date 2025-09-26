import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DriverScreen from './src/screens/DriverScreen';
import EcommerceScreen from './src/screens/EcommerceScreen';
import StoreKeeperScreen from './src/screens/StoreKeeperScreen';
import ToastComponent from './src/components/ToastComponent';
import { User } from './src/types/User';
import { initializeStripe } from './src/services/stripeService';

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
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          {/* No StripeProvider for web */}
          <SignupScreen 
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={handleBackToLogin}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {/* No StripeProvider for web */}
        <LoginScreen 
          onLogin={handleLogin} 
          onShowSignup={handleShowSignup}
        />
      </SafeAreaView>
    );
  }

  // Navigate based on user role
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* No StripeProvider for web */}
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
      {/* Toast notifications overlay */}
      <ToastComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});