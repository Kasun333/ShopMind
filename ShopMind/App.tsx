import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DriverScreen from './src/screens/DriverScreen';
import EcommerceScreen from './src/screens/EcommerceScreen';
import StoreKeeperScreen from './src/screens/StoreKeeperScreen';
import { User } from './src/types/User';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);

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
        <SignupScreen 
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onShowSignup={handleShowSignup}
      />
    );
  }

  // Navigate based on user role
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
}
