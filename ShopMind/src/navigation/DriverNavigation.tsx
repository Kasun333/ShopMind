import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types/User';
import DriverDashboard from '../screens/driver/DriverDashboard';
import DeliveryManagement from '../screens/driver/DeliveryManagement';
import TruckMaintenance from '../screens/driver/TruckMaintenance';
import VehicleScreen from '../screens/driver/VehicleScreen';

interface DriverNavigationProps {
  user: User;
  token: string;
  onLogout: () => void;
}

type DriverScreen = 'home' | 'orders' | 'notifications' | 'vehicle';

const DriverNavigation: React.FC<DriverNavigationProps> = ({ user, token, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState<DriverScreen>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <DriverDashboard
            user={user}
            token={token}
            onNavigateToOrders={() => setCurrentScreen('orders')}
            onNavigateToNotifications={() => setCurrentScreen('notifications')}
            onLogout={onLogout}
          />
        );
      case 'orders':
        return (
          <DeliveryManagement
            user={user}
            token={token}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'notifications':
        return (
          <TruckMaintenance
            user={user}
            token={token}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'vehicle':
        return (
          <VehicleScreen
            user={user}
            token={token}
          />
        );
      default:
        return (
          <DriverDashboard
            user={user}
            token={token}
            onNavigateToOrders={() => setCurrentScreen('orders')}
            onNavigateToNotifications={() => setCurrentScreen('notifications')}
            onLogout={onLogout}
          />
        );
    }
  };

  const getTabIcon = (screen: DriverScreen, iconName: string) => {
    const isActive = currentScreen === screen;
    return (
      <Ionicons 
        name={iconName as any} 
        size={24} 
        color={isActive ? '#3B82F6' : '#6B7280'} 
      />
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'home' && styles.activeTab]}
          onPress={() => setCurrentScreen('home')}
        >
          {getTabIcon('home', 'home-outline')}
          <View style={styles.tabLabel}>
            <View style={[styles.tabDot, currentScreen === 'home' && styles.activeTabDot]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentScreen === 'orders' && styles.activeTab]}
          onPress={() => setCurrentScreen('orders')}
        >
          {getTabIcon('orders', 'list-outline')}
          <View style={styles.tabLabel}>
            <View style={[styles.tabDot, currentScreen === 'orders' && styles.activeTabDot]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentScreen === 'notifications' && styles.activeTab]}
          onPress={() => setCurrentScreen('notifications')}
        >
          {getTabIcon('notifications', 'notifications-outline')}
          <View style={styles.tabLabel}>
            <View style={[styles.tabDot, currentScreen === 'notifications' && styles.activeTabDot]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentScreen === 'vehicle' && styles.activeTab]}
          onPress={() => setCurrentScreen('vehicle')}
        >
          {getTabIcon('vehicle', 'car-outline')}
          <View style={styles.tabLabel}>
            <View style={[styles.tabDot, currentScreen === 'vehicle' && styles.activeTabDot]} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabLabel: {
    marginTop: 4,
    alignItems: 'center',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  activeTabDot: {
    backgroundColor: '#3B82F6',
  },
});

export default DriverNavigation;
