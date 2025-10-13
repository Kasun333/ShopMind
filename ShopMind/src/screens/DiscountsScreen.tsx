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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Discount, DiscountType } from '../types/Discount';
import { discountService } from '../services/discountService';
import DiscountDetailsModal from '../components/DiscountDetailsModal';
import DiscountSkeleton from '../components/DiscountSkeleton';

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
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountBadgeText}>{discountDisplay}</Text>
          </LinearGradient>
          <View style={styles.discountTypeBadge}>
            <MaterialCommunityIcons 
              name={discount.type === DiscountType.BILL_DISCOUNT ? 'receipt-text' : 'tag'} 
              size={14} 
              color="#6366F1" 
            />
            <Text style={styles.discountTypeText}>
              {discount.type === DiscountType.BILL_DISCOUNT ? 'Bill' : 'Product'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.discountName}>{discount.discountName}</Text>
        <View style={styles.codeContainer}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={16} color="#6B7280" />
          <Text style={styles.discountCode}>{discount.discountCode}</Text>
        </View>
        <Text style={styles.discountDescription}>{discount.description}</Text>
        
        <View style={styles.discountDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="cart-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Min. Order</Text>
            </View>
            <Text style={styles.detailValue}>${discount.minOrderAmount.toFixed(2)}</Text>
          </View>
          
          {discount.maxDiscountAmount > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="trending-up-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Max Discount</Text>
              </View>
              <Text style={styles.detailValue}>${discount.maxDiscountAmount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Valid Until</Text>
            </View>
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
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#072033ff', '#2A7CC7', '#245e91ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundBox}
        />
        
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Available Discounts</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Loading Skeletons */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.skeletonContainer}>
          <DiscountSkeleton />
          <DiscountSkeleton />
          <DiscountSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundBox}
      />
      
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Available Discounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
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
            <MaterialCommunityIcons name="ticket-percent-outline" size={80} color="#D1D5DB" />
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
        <Ionicons name="information-circle" size={20} color="#6366F1" />
        <Text style={styles.infoBannerText}>
          Tap on any discount to view details
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
    backgroundColor: '#F8F9FA',
  },
  backgroundBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingLeft: 20,
    zIndex: 1,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFilterButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    marginTop: -12,
  },
  skeletonContainer: {
    padding: 20,
    paddingTop: 24,
  },
  discountsContainer: {
    padding: 20,
    paddingTop: 24,
  },
  discountsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '600',
  },
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  expiredCard: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discountBadge: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: 'rgba(239, 68, 68, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  discountTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountTypeText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
  },
  discountName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  discountCode: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  discountDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  discountDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  expiredBanner: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  expiredText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 14,
    margin: 20,
    marginTop: 0,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  // Deprecated styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
});

export default DiscountsScreen;