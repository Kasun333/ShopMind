import React, { useState } from 'react';
import { User } from '../types/User';
import DriverDashboard from '../screens/driver/DriverDashboard';
import DeliveryManagement from '../screens/driver/DeliveryManagement';
import TruckMaintenance from '../screens/driver/TruckMaintenance';

interface DriverNavigationProps {
  user: User;
  token: string;
  onLogout: () => void;
}

type DriverScreen = 'dashboard' | 'deliveries' | 'maintenance';

const DriverNavigation: React.FC<DriverNavigationProps> = ({ user, token, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState<DriverScreen>('dashboard');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DriverDashboard
            user={user}
            token={token}
            onNavigateToDeliveries={() => setCurrentScreen('deliveries')}
            onNavigateToMaintenance={() => setCurrentScreen('maintenance')}
            onLogout={onLogout}
          />
        );
      case 'deliveries':
        return (
          <DeliveryManagement
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'maintenance':
        return (
          <TruckMaintenance
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      default:
        return (
          <DriverDashboard
            user={user}
            token={token}
            onNavigateToDeliveries={() => setCurrentScreen('deliveries')}
            onNavigateToMaintenance={() => setCurrentScreen('maintenance')}
            onLogout={onLogout}
          />
        );
    }
  };

  return renderScreen();
};

export default DriverNavigation;
