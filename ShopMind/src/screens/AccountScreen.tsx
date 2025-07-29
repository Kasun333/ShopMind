import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface AccountScreenProps {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
  onLogout: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, token, onLogout }) => {
  const accountOptions = [
    { id: '1', icon: '👤', title: 'Profile Information', subtitle: 'Edit your personal details', hasArrow: true },
    { id: '2', icon: '📍', title: 'Addresses', subtitle: 'Manage delivery addresses', hasArrow: true },
    { id: '3', icon: '💳', title: 'Payment Methods', subtitle: 'Cards and payment options', hasArrow: true },
    { id: '4', icon: '📦', title: 'Order History', subtitle: 'View past orders', hasArrow: true },
    { id: '5', icon: '❤️', title: 'Wishlist', subtitle: 'Your saved items', hasArrow: true },
    { id: '6', icon: '🔔', title: 'Notifications', subtitle: 'Manage your preferences', hasArrow: true },
    { id: '7', icon: '🛡️', title: 'Privacy & Security', subtitle: 'Account security settings', hasArrow: true },
    { id: '8', icon: '❓', title: 'Help & Support', subtitle: 'Get help and contact us', hasArrow: true },
    { id: '9', icon: '📋', title: 'Terms & Conditions', subtitle: 'App terms and policies', hasArrow: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Manage your profile and preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profileRole}>{user.role}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account Options */}
        <View style={styles.optionsContainer}>
          {accountOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.optionItem}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>{option.icon}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {option.hasArrow && (
                <Text style={styles.optionArrow}>→</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>ShopMind</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2025 ShopMind. All rights reserved.</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 28,
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editProfileButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editProfileText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 18,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  optionArrow: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 40,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
