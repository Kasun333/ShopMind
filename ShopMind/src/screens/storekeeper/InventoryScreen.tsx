import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import RestockModal from '../../components/RestockModal';
import { RestockResponse } from '../../services/restockService';
import stockAlertsService, { StockAlert, StockAlertWithProduct } from '../../services/stockAlertsService';

const { width } = Dimensions.get('window');

interface InventoryScreenProps {
  user: User;
  token: string;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ user, token }) => {
  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  
  // Stock alerts state
  const [stockAlerts, setStockAlerts] = useState<StockAlertWithProduct[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  
  // Dynamic inventory stats based on real data
  const [inventoryStats, setInventoryStats] = useState([
    { title: 'Total Products', value: '...', color: '#059669', icon: 'cube-outline' },
    { title: 'Low Stock', value: '...', color: '#EF4444', icon: 'alert-circle-outline' },
    { title: 'Out of Stock', value: '...', color: '#F59E0B', icon: 'close-circle-outline' },
    { title: 'Categories', value: '15', color: '#047857', icon: 'folder-outline' },
  ]);

  const currentDateTime = "2025-08-18 19:11:43";
  const currentUser = "Kasun333";

  // Fetch stock alerts from API
  const fetchStockAlerts = async () => {
    try {
      setAlertsLoading(true);
      setAlertsError(null);
      
      console.log('📊 Fetching stock alerts for inventory screen...');
      
      const [alerts, stats] = await Promise.all([
        stockAlertsService.getStockAlerts(token),
        stockAlertsService.getInventoryStats(token)
      ]);

      // Format alerts for display
      const formattedAlerts = alerts.map(alert => 
        stockAlertsService.formatAlertForDisplay(alert)
      );
      
      setStockAlerts(formattedAlerts);
      
      // Update inventory stats with real data
      setInventoryStats(prev => prev.map(stat => {
        switch (stat.title) {
          case 'Low Stock':
            return { ...stat, value: stats.lowStockCount.toString() };
          case 'Out of Stock':
            return { ...stat, value: stats.outOfStockCount.toString() };
          case 'Total Products':
            return { ...stat, value: '1,234' }; // Keep static for now
          default:
            return stat;
        }
      }));
      
      console.log('✅ Stock alerts loaded successfully:', formattedAlerts.length, 'alerts');
      
    } catch (error) {
      console.error('❌ Failed to fetch stock alerts:', error);
      setAlertsError('Failed to load stock alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchStockAlerts();
  }, [token]);

  // Restock handlers
  const handleRestockPress = () => {
    setShowRestockModal(true);
  };

  const handleRestockSuccess = (restockData: RestockResponse) => {
    console.log('✅ Restock completed:', restockData);
    
    // Show success message
    Alert.alert(
      'Restock Successful! 🎉',
      `${restockData.productName}\nAdded: ${restockData.quantityAdded} units\nNew Available Stock: ${restockData.newAvailableStock}`,
      [{ text: 'OK' }]
    );
    
    // Refresh stock alerts after successful restock
    fetchStockAlerts();
  };

  const handleRestockClose = () => {
    setShowRestockModal(false);
  };

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
              <Text style={styles.title}>Inventory Management</Text>
              <Text style={styles.subtitle}>Track and manage your products</Text>
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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {inventoryStats.map((stat, index) => (
            <View key={index} style={styles.statCardContainer}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, { borderLeftColor: stat.color }]}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flash-outline" size={20} color="#047857" style={styles.sectionIcon} />
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCardContainer} activeOpacity={0.8}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="add-circle-outline" size={28} color="#059669" />
                </View>
                <Text style={styles.actionTitle}>Add Product</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCardContainer} activeOpacity={0.8}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="document-text-outline" size={28} color="#059669" />
                </View>
                <Text style={styles.actionTitle}>Stock Report</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardContainer} 
              activeOpacity={0.8}
              onPress={handleRestockPress}
            >
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="refresh-outline" size={28} color="#059669" />
                </View>
                <Text style={styles.actionTitle}>Restock</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCardContainer} activeOpacity={0.8}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="bar-chart-outline" size={28} color="#059669" />
                </View>
                <Text style={styles.actionTitle}>Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Low Stock Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle-outline" size={20} color="#047857" style={styles.sectionIcon} />
              Low Stock Alerts
            </Text>
            <TouchableOpacity 
              onPress={fetchStockAlerts} 
              style={styles.refreshButton}
              disabled={alertsLoading}
            >
              <Ionicons 
                name={alertsLoading ? "hourglass-outline" : "refresh-outline"} 
                size={18} 
                color="#047857" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.alertsContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertsGradient}
            >
              {alertsLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading alerts...</Text>
                </View>
              ) : alertsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{alertsError}</Text>
                  <TouchableOpacity onPress={fetchStockAlerts} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : stockAlerts.length === 0 ? (
                <View style={styles.noAlertsContainer}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#059669" />
                  <Text style={styles.noAlertsText}>No stock alerts</Text>
                  <Text style={styles.noAlertsSubtext}>All products are well stocked!</Text>
                </View>
              ) : (
                stockAlerts.map((alert, index) => (
                  <View key={alert.alertId} style={[
                    styles.alertItem,
                    index < stockAlerts.length - 1 && styles.alertItemBorder
                  ]}>
                    <View style={styles.alertInfo}>
                      <View style={styles.alertHeader}>
                        <Text style={styles.alertName}>{alert.productName}</Text>
                        <View style={[styles.alertTypeBadge, 
                          alert.alertType === 'OUT_OF_STOCK' ? styles.outOfStockBadge : styles.lowStockBadge
                        ]}>
                          <Text style={styles.alertTypeText}>
                            {alert.alertType === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.alertStock}>
                        <Ionicons name="cube-outline" size={14} color="#64748B" /> 
                        {alert.alertType === 'OUT_OF_STOCK' 
                          ? 'Stock: 0' 
                          : `Current: ${alert.currentStock || 0} | Threshold: ${alert.threshold || 'N/A'}`
                        }
                      </Text>
                      <Text style={styles.alertTime}>
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" /> 
                        {stockAlertsService.formatTimeSince(alert.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.restockButtonContainer} 
                      activeOpacity={0.8}
                      onPress={handleRestockPress}
                    >
                      <LinearGradient
                        colors={alert.alertType === 'OUT_OF_STOCK' 
                          ? ['#EF4444', '#DC2626'] 
                          : ['#059669', '#047857']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.restockButton}
                      >
                        <Text style={styles.restockButtonText}>Restock</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Coming Soon Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={20} color="#047857" style={styles.sectionIcon} />
            Coming Soon
          </Text>
          <View style={styles.comingSoonCardContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.comingSoonCard}
            >
              <View style={styles.comingSoonIconContainer}>
                <Ionicons name="construct-outline" size={36} color="#059669" />
              </View>
              <Text style={styles.comingSoonTitle}>Full Inventory Management</Text>
              <Text style={styles.comingSoonDescription}>
                Product catalog, stock tracking, supplier management, and more features are coming soon!
              </Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={['#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Restock Modal */}
      <RestockModal
        visible={showRestockModal}
        onClose={handleRestockClose}
        token={token}
        onRestockSuccess={handleRestockSuccess}
      />
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    marginTop: 10,
  },
  statCardContainer: {
    width: (width - 52) / 2,
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
  statCard: {
    padding: 16,
    borderLeftWidth: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(4, 120, 87, 0.1)',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCardContainer: {
    width: (width - 52) / 2,
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
  actionCard: {
    padding: 20,
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    textAlign: 'center',
  },
  alertsContainer: {
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
  alertsGradient: {
    paddingVertical: 8,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  alertItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.1)',
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  alertName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  alertTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockBadge: {
    backgroundColor: '#FEF3C7',
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
  },
  alertTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  alertStock: {
    fontSize: 14,
    color: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noAlertsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  restockButtonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  restockButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  restockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoonCardContainer: {
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
  comingSoonCard: {
    padding: 24,
    alignItems: 'center',
  },
  comingSoonIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InventoryScreen;