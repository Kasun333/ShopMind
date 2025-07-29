import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: 'home' | 'messages' | 'cart' | 'account';
  onTabPress: (tab: 'home' | 'messages' | 'cart' | 'account') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'messages', icon: '💬', label: 'Messages' },
    { id: 'cart', icon: '🛒', label: 'Cart' },
    { id: 'account', icon: '👤', label: 'Account' },
  ] as const;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => onTabPress(tab.id)}
        >
          <Text style={[
            styles.tabIcon,
            activeTab === tab.id && styles.activeTabIcon
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20, // Space for phone navigation
    paddingTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default BottomNavigation;
