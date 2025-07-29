import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import MessagesScreen from './MessagesScreen';
import CartScreen from './CartScreen';
import AccountScreen from './AccountScreen';
import { User } from '../types/User';

const { width } = Dimensions.get('window');

interface EcommerceScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const EcommerceScreen: React.FC<EcommerceScreenProps> = ({ user, token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'cart' | 'account'>('home');

  const categories = [
    { name: 'Electronics', icon: '📱' },
    { name: 'Clothing', icon: '👕' },
    { name: 'Home & Garden', icon: '🏠' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Books', icon: '📚' },
    { name: 'Food', icon: '🍔' },
  ];

  const handleTabPress = (tab: 'home' | 'messages' | 'cart' | 'account') => {
    setActiveTab(tab);
  };

  // Render different screens based on active tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'messages':
        return <MessagesScreen user={user} token={token} />;
      case 'cart':
        return <CartScreen user={user} token={token} />;
      case 'account':
        return <AccountScreen user={user} token={token} onLogout={onLogout} />;
      default:
        return renderHomeScreen();
    }
  };

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ShopMind</Text>
        <Text style={styles.subtitle}>Hello, {user.fullName}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchText}>🔍 Search products...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <View style={styles.productCard}>
            <View style={styles.productPlaceholder} />
            <Text style={styles.productName}>Sample Product</Text>
            <Text style={styles.productPrice}>$99.99</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={styles.cartButtonText}>🛒 View Cart (0)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {renderScreen()}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

export default EcommerceScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 30,
  },
  searchButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productPlaceholder: {
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '700',
  },
  cartButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
