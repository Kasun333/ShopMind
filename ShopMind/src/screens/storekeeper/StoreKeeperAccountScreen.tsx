import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

const { width } = Dimensions.get('window');

interface StoreKeeperAccountScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const StoreKeeperAccountScreen: React.FC<StoreKeeperAccountScreenProps> = ({ user, token, onLogout }) => {
  const accountOptions = [
    { id: '1', icon: 'person-outline', title: 'Profile Settings', subtitle: 'Edit your personal information', hasArrow: true },
    { id: '2', icon: 'business-outline', title: 'Store Settings', subtitle: 'Manage store information', hasArrow: true },
    { id: '3', icon: 'stats-chart-outline', title: 'Sales Reports', subtitle: 'View detailed analytics', hasArrow: true },
    { id: '4', icon: 'card-outline', title: 'Payment Settings', subtitle: 'Manage payment methods', hasArrow: true },
    { id: '5', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage your preferences', hasArrow: true },
    { id: '6', icon: 'shield-outline', title: 'Security', subtitle: 'Password and security settings', hasArrow: true },
    { id: '7', icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get help and contact us', hasArrow: true },
    { id: '8', icon: 'document-text-outline', title: 'Terms & Policies', subtitle: 'Store terms and policies', hasArrow: true },
  ];

  const currentDateTime = "2025-08-18 19:50:11";
  const currentUser = "Kasun333";

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#047857', '#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Store Account</Text>
          
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerInfo}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" /> {currentDateTime}
              </Text>
              <Text style={styles.headerInfo}>
                <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.8)" /> {currentUser}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Profile Card */}
        <View style={styles.profileCardContainer}>
          <LinearGradient
            colors={['#ECFDF5', '#D1FAE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatarContainer}>
              {user.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
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
              <Text style={styles.profileEmail}>
                <Ionicons name="mail-outline" size={14} color="#64748B" /> {user.email}
              </Text>
              <Text style={styles.profilePhone}>
                <Ionicons name="call-outline" size={14} color="#64748B" /> {user.phoneNumber}
              </Text>
              <View style={styles.roleContainer}>
                <Text style={styles.profileRole}>{user.role}</Text>
                <Text style={styles.profileStatus}>{user.accountStatus}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileButton} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={18} color="#059669" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Store Statistics */}
        <View style={styles.statsCardContainer}>
          <LinearGradient
            colors={['#ECFDF5', '#D1FAE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>
              <Ionicons name="bar-chart-outline" size={18} color="#047857" style={styles.sectionIcon} />
              Store Performance
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIconBg}>
                  <Ionicons name="document-text-outline" size={18} color="#059669" />
                </View>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBg}>
                  <Ionicons name="cash-outline" size={18} color="#059669" />
                </View>
                <Text style={styles.statNumber}>$23.4k</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBg}>
                  <Ionicons name="star-outline" size={18} color="#059669" />
                </View>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBg}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                </View>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* User Details Cards */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCardContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCard}
            >
              <Text style={styles.detailLabel}>
                <Ionicons name="location-outline" size={16} color="#047857" /> Store Address
              </Text>
              <Text style={styles.detailValue}>{user.formattedAddress}</Text>
            </LinearGradient>
          </View>

          <View style={styles.detailCardContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCard}
            >
              <Text style={styles.detailLabel}>
                <Ionicons name="calendar-outline" size={16} color="#047857" /> Member Since
              </Text>
              <Text style={styles.detailValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.detailCardContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCard}
            >
              <Text style={styles.detailLabel}>
                <Ionicons name="navigate-outline" size={16} color="#047857" /> Location
              </Text>
              <Text style={styles.detailValue}>
                {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="settings-outline" size={20} color="#047857" style={styles.sectionIcon} />
            Account Settings
          </Text>
          <View style={styles.optionsContainer}>
            {accountOptions.map((option) => (
              <TouchableOpacity key={option.id} style={styles.optionItem} activeOpacity={0.7}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon as any} size={20} color="#059669" />
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
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <LinearGradient
            colors={['#FEE2E2', '#FECACA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>ShopMind Store</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2025 ShopMind. All rights reserved.</Text>
          <Text style={styles.appInfoDate}>{currentDateTime}</Text>
          <Text style={styles.appInfoUser}>{currentUser}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerSafe: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  section: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  profileCardContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileCard: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhone: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileRole: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  profileStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  editProfileButton: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  detailCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCard: {
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.1)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 40,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#047857',
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
    marginBottom: 8,
  },
  appInfoDate: {
    fontSize: 12,
    color: '#64748B',
  },
  appInfoUser: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default StoreKeeperAccountScreen;