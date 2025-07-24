import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface StoreKeeperScreenProps {
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

const StoreKeeperScreen: React.FC<StoreKeeperScreenProps> = ({ user, token, onLogout }) => {
  const stats = [
    { title: 'Total Products', value: '1,234', color: '#3B82F6' },
    { title: 'Low Stock Items', value: '23', color: '#EF4444' },
    { title: 'Orders Today', value: '45', color: '#10B981' },
    { title: 'Revenue Today', value: '$2,350', color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store Keeper</Text>
        <Text style={styles.subtitle}>Welcome, {user.fullName}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📦</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Inventory</Text>
              <Text style={styles.actionSubtitle}>Add, edit, or remove products</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionSubtitle}>Sales and inventory reports</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🚚</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Orders</Text>
              <Text style={styles.actionSubtitle}>Process and track orders</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚠️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Low Stock Alerts</Text>
              <Text style={styles.actionSubtitle}>View items running low</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>No recent activity</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StoreKeeperScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activityCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activityText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
