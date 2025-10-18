import { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DriverScreen from './src/screens/DriverScreen';
import EcommerceScreen from './src/screens/EcommerceScreen';
import StoreKeeperScreen from './src/screens/StoreKeeperScreen';
import ToastComponent from './src/components/ToastComponent';
import InAppNotificationService from './src/services/inAppNotificationService';
import { User } from './src/types/User';
import { initializeStripe } from './src/services/stripeService';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes (formerly cacheTime)
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
      refetchOnReconnect: true, // Refetch when reconnecting to internet
    },
  },
});

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RruEkCMSVvAbN0Rb1KpfTDO1yPhc7R3BNFALqZTR1G2bggo2w1rSEx78EKBkt8VwRgls5isLAO0OyHyz88FrEtf00JDvUIAap';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // Initialize Stripe
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

  // Initialize Notifications
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('🔔 Initializing notification system...');
        const hasPermissions = await InAppNotificationService.initialize();
        setNotificationsInitialized(true);
        if (hasPermissions) {
          console.log('✅ Notifications initialized successfully');
        } else {
          console.warn('⚠️ Notification permissions not granted');
        }
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
        setNotificationsInitialized(true); // Continue app even if notifications fail
      }
    };
    initNotifications();
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
        <QueryClientProvider client={queryClient}>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
              <SignupScreen 
                onSignupSuccess={handleSignupSuccess}
                onBackToLogin={handleBackToLogin}
              />
            </StripeProvider>
          </SafeAreaView>
        </QueryClientProvider>
      );
    }
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <LoginScreen 
              onLogin={handleLogin} 
              onShowSignup={handleShowSignup}
            />
          </StripeProvider>
        </SafeAreaView>
      </QueryClientProvider>
    );
  }

  // Navigate based on user role
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
          {/* Toast notifications overlay */}
          <ToastComponent />
        </StripeProvider>
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
