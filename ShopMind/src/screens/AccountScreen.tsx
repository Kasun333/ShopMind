import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from '../types/User';

const { width } = Dimensions.get('window');

interface AccountScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, token, onLogout }) => {
  const accountOptions = [
    { id: '1', icon: 'account-edit', title: 'Profile Information', subtitle: 'Edit your personal details', hasArrow: true },
    { id: '2', icon: 'map-marker-multiple', title: 'Addresses', subtitle: 'Manage delivery addresses', hasArrow: true },
    { id: '3', icon: 'credit-card-outline', title: 'Payment Methods', subtitle: 'Cards and payment options', hasArrow: true },
    { id: '4', icon: 'package-variant', title: 'Order History', subtitle: 'View past orders', hasArrow: true },
    { id: '5', icon: 'heart-outline', title: 'Wishlist', subtitle: 'Your saved items', hasArrow: true },
    { id: '6', icon: 'bell-ring', title: 'Notifications', subtitle: 'Manage your preferences', hasArrow: true },
    { id: '7', icon: 'shield-lock', title: 'Privacy & Security', subtitle: 'Account security settings', hasArrow: true },
    { id: '8', icon: 'help-circle', title: 'Help & Support', subtitle: 'Get help and contact us', hasArrow: true },
    { id: '9', icon: 'file-document-outline', title: 'Terms & Conditions', subtitle: 'App terms and policies', hasArrow: true },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="account-circle" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>My Account</Text>
          <Text style={styles.subtitle}>Manage your profile and preferences</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#2A7CC7', '#1E6091']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={[
              styles.statusBadge,
              user.accountStatus === 'ACTIVE' ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={styles.statusText}>
                {user.accountStatus === 'ACTIVE' ? '●' : '○'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profilePhone}>{user.phoneNumber}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.profileRole}>{user.role}</Text>
              <Text style={styles.profileStatus}>{user.accountStatus}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="pencil-outline" size={18} color="#2A7CC7" />
          </TouchableOpacity>
        </View>

        {/* User Details Cards */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            <View style={styles.detailIconWrapper}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#2A7CC7" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{user.formattedAddress}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailIconWrapper}>
              <MaterialCommunityIcons name="calendar-heart" size={20} color="#2A7CC7" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>
                {new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailIconWrapper}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#2A7CC7" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailIconWrapper}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#2A7CC7" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.optionsContainer}>
          {accountOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.optionItem} activeOpacity={0.7}>
              <View style={styles.optionIcon}>
                <MaterialCommunityIcons name={option.icon as any} size={24} color="#2A7CC7" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {option.hasArrow && (
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>ShopMind</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2025 ShopMind. All rights reserved.</Text>
          <Text style={styles.appInfoDate}>Last Login: 2025-08-18 17:18:28</Text>
          <Text style={styles.appInfoUser}>User: Kasun333</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <LinearGradient
            colors={['#F87171', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </LinearGradient>
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
  headerGradient: {
    paddingTop: 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -30,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '400',
  },
  profilePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '400',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileRole: {
    fontSize: 11,
    color: '#2A7CC7',
    fontWeight: '600',
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profileStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editProfileButton: {
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  appInfoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E6091',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '400',
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 8,
  },
  appInfoDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  appInfoUser: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  logoutButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});

export default AccountScreen;