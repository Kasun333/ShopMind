import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import DriverScreen from './src/screens/DriverScreen';
import EcommerceScreen from './src/screens/EcommerceScreen';
import StoreKeeperScreen from './src/screens/StoreKeeperScreen';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  // If user is not logged in, show login screen
  if (!user || !token) {
    return <LoginScreen onLogin={handleLogin} />;
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
