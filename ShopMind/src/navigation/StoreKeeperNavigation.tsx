import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { User } from '../types/User';
import StoreKeeperBottomNav from '../components/storekeeper/StoreKeeperBottomNav';
import StoreKeeperDashboard from '../screens/storekeeper/StoreKeeperDashboard';
import ManageOrdersScreen from '../screens/storekeeper/ManageOrdersScreen';
import InventoryScreen from '../screens/storekeeper/InventoryScreen';
import StoreKeeperAccountScreen from '../screens/storekeeper/StoreKeeperAccountScreen';

interface StoreKeeperNavigationProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const StoreKeeperNavigation: React.FC<StoreKeeperNavigationProps> = ({ user, token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'account'>('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StoreKeeperDashboard 
            user={user} 
            token={token} 
            setActiveTab={setActiveTab}
          />
        );
      case 'orders':
        return <ManageOrdersScreen user={user} token={token} />;
      case 'inventory':
        return <InventoryScreen user={user} token={token} />;
      case 'account':
        return <StoreKeeperAccountScreen user={user} token={token} onLogout={onLogout} />;
      default:
        return (
          <StoreKeeperDashboard 
            user={user} 
            token={token} 
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <StoreKeeperBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});

export default StoreKeeperNavigation;
