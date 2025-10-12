import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Discount, DiscountType } from '../types/Discount';
import { discountService } from '../services/discountService';
import DiscountDetailsModal from '../components/DiscountDetailsModal';

const { width } = Dimensions.get('window');

interface DiscountsScreenProps {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  onBack?: () => void;
  onApplyDiscount?: (discountCode: string) => void;
}

const DiscountsScreen: React.FC<DiscountsScreenProps> = ({ user, onBack, onApplyDiscount }) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<DiscountType | 'ALL'>('ALL');
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadDiscounts();
  }, [selectedType]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const type = selectedType === 'ALL' ? undefined : selectedType;
      const fetchedDiscounts = await discountService.getActiveDiscounts(type);
      setDiscounts(fetchedDiscounts);
    } catch (error) {
      console.error('Error loading discounts:', error);
      Alert.alert('Error', 'Failed to load discounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiscounts();
    setRefreshing(false);
  };

  const handleDiscountTap = (discount: Discount) => {
    setSelectedDiscount(discount);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDiscount(null);
  };

  const renderDiscountCard = (discount: Discount) => {
    const isValid = discountService.isDiscountValid(discount);
    const discountDisplay = discountService.formatDiscountDisplay(discount);
    
    return (
      <TouchableOpacity 
        key={discount.id} 
        style={[styles.discountCard, !isValid && styles.expiredCard]}
        onPress={() => handleDiscountTap(discount)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountDisplay}</Text>
          </View>
          <View style={styles.discountTypeBadge}>
            <Text style={styles.discountTypeText}>
              {discount.type === DiscountType.BILL_DISCOUNT ? 'Bill Discount' : 'Product Discount'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.discountName}>{discount.discountName}</Text>
        <Text style={styles.discountCode}>Code: {discount.discountCode}</Text>
        <Text style={styles.discountDescription}>{discount.description}</Text>
        
        <View style={styles.discountDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Minimum Order:</Text>
            <Text style={styles.detailValue}>${discount.minOrderAmount.toFixed(2)}</Text>
          </View>
          
          {discount.maxDiscountAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Discount:</Text>
              <Text style={styles.detailValue}>${discount.maxDiscountAmount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid Until:</Text>
            <Text style={styles.detailValue}>
              {new Date(discount.validTo).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {!isValid && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>EXPIRED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filterButtons = [
    { key: 'ALL', label: 'All Discounts' },
    { key: DiscountType.BILL_DISCOUNT, label: 'Bill Discounts' },
    { key: DiscountType.PRODUCT_DISCOUNT, label: 'Product Discounts' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading discounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Available Discounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedType === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedType(filter.key as DiscountType | 'ALL')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === filter.key && styles.activeFilterButtonText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Discounts List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {discounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No Discounts Available</Text>
            <Text style={styles.emptySubtitle}>
              {selectedType === 'ALL' 
                ? 'No active discounts found. Check back later for great deals!'
                : `No ${selectedType.toLowerCase().replace('_', ' ')}s available right now.`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.discountsContainer}>
            <Text style={styles.discountsCount}>
              {discounts.length} {discounts.length === 1 ? 'discount' : 'discounts'} available
            </Text>
            {discounts.map(renderDiscountCard)}
          </View>
        )}
      </ScrollView>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          💡 Tap on any discount to view detailed information and applicable products
        </Text>
      </View>

      {/* Discount Details Modal */}
      <DiscountDetailsModal
        visible={showDetailsModal}
        discount={selectedDiscount}
        onClose={handleCloseModal}
        onApplyDiscount={onApplyDiscount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  discountsContainer: {
    padding: 20,
  },
  discountsCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  discountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  expiredCard: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  discountTypeBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountTypeText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  discountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  discountCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  discountDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  discountDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  expiredBanner: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expiredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBanner: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});

export default DiscountsScreen;