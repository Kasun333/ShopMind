import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { Discount, DiscountDetailsResponse, DiscountType } from '../types/Discount';
import { discountService } from '../services/discountService';

const { width } = Dimensions.get('window');

interface DiscountDetailsModalProps {
  visible: boolean;
  discount: Discount | null;
  onClose: () => void;
  onApplyDiscount?: (discountCode: string) => void;
}

const DiscountDetailsModal: React.FC<DiscountDetailsModalProps> = ({
  visible,
  discount,
  onClose,
  onApplyDiscount,
}) => {
  const [discountDetails, setDiscountDetails] = useState<DiscountDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && discount) {
      loadDiscountDetails();
    } else {
      setDiscountDetails(null);
    }
  }, [visible, discount]);

  const loadDiscountDetails = async () => {
    if (!discount) return;

    setLoading(true);
    try {
      const details = await discountService.getDiscountDetails(discount.id);
      setDiscountDetails(details);
    } catch (error) {
      console.error('Error loading discount details:', error);
      Alert.alert('Error', 'Failed to load discount details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    if (discount && onApplyDiscount) {
      onApplyDiscount(discount.discountCode);
      onClose();
    }
  };

  const formatDiscountValue = () => {
    if (!discount) return '';
    return discount.isPercentage 
      ? `${discount.discountValue}% OFF`
      : `$${discount.discountValue.toFixed(2)} OFF`;
  };

  const isDiscountValid = () => {
    if (!discount) return false;
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);
    return now >= validFrom && now <= validTo;
  };

  if (!discount) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Discount Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Discount Badge */}
            <View style={styles.discountBadgeContainer}>
              <View style={[styles.discountBadge, !isDiscountValid() && styles.expiredBadge]}>
                <Text style={styles.discountBadgeText}>{formatDiscountValue()}</Text>
              </View>
              {!isDiscountValid() && (
                <View style={styles.expiredLabel}>
                  <Text style={styles.expiredText}>EXPIRED</Text>
                </View>
              )}
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.discountName}>{discount.discountName}</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Discount Code:</Text>
                <Text style={styles.discountCode}>{discount.discountCode}</Text>
              </View>
              <Text style={styles.discountDescription}>{discount.description}</Text>
            </View>

            {/* Discount Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Discount Type</Text>
              <View style={styles.typeContainer}>
                <Text style={styles.typeIcon}>
                  {discount.type === DiscountType.BILL_DISCOUNT ? '💰' : '🏷️'}
                </Text>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>
                    {discount.type === DiscountType.BILL_DISCOUNT ? 'Bill Discount' : 'Product Discount'}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {discount.type === DiscountType.BILL_DISCOUNT 
                      ? 'Applies to your entire order total'
                      : 'Applies to specific products only'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Terms & Conditions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              <View style={styles.termItem}>
                <Text style={styles.termIcon}>💳</Text>
                <Text style={styles.termText}>
                  Minimum order amount: ${discount.minOrderAmount.toFixed(2)}
                </Text>
              </View>
              
              {discount.maxDiscountAmount > 0 && (
                <View style={styles.termItem}>
                  <Text style={styles.termIcon}>📊</Text>
                  <Text style={styles.termText}>
                    Maximum discount: ${discount.maxDiscountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.termItem}>
                <Text style={styles.termIcon}>📅</Text>
                <Text style={styles.termText}>
                  Valid until: {new Date(discount.validTo).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Product Details (for Product Discounts) */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : discountDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {discountDetails.discountType === DiscountType.PRODUCT_DISCOUNT 
                    ? `Eligible Products (${discountDetails.totalProducts})`
                    : 'Discount Information'
                  }
                </Text>
                
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{discountDetails.message}</Text>
                </View>

                {discountDetails.discountType === DiscountType.PRODUCT_DISCOUNT && 
                 discountDetails.products.length > 0 && (
                  <View style={styles.productsContainer}>
                    <Text style={styles.productsTitle}>Applicable Products:</Text>
                    {discountDetails.products.map((product, index) => (
                      <View key={product.id} style={styles.productItem}>
                        {/* Product Image */}
                        {product.imageUrl ? (
                          <Image 
                            source={{ uri: product.imageUrl }} 
                            style={styles.productImage}
                            defaultSource={{uri: 'https://via.placeholder.com/50x50?text=📦'}}
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Text style={styles.productImagePlaceholderText}>📦</Text>
                          </View>
                        )}
                        
                        {/* Product Info */}
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{product.productName}</Text>
                          {product.description && (
                            <Text style={styles.productDescription} numberOfLines={2}>
                              {product.description}
                            </Text>
                          )}
                          <View style={styles.productDetailsRow}>
                            <Text style={styles.productId}>ID: {product.productId}</Text>
                            {product.price && (
                              <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                            )}
                          </View>
                          {product.productBarcode && (
                            <Text style={styles.productBarcode}>Barcode: {product.productBarcode}</Text>
                          )}
                          <Text style={styles.addedAt}>
                            Added: {new Date(product.addedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {isDiscountValid() && onApplyDiscount && (
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={handleApplyDiscount}
              >
                <Text style={styles.applyButtonText}>Apply This Discount</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeActionButton} onPress={onClose}>
              <Text style={styles.closeActionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  discountBadgeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  expiredBadge: {
    backgroundColor: '#9CA3AF',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  expiredLabel: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  expiredText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  discountName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  discountCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: 'monospace',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  termText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  messageContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
  productsContainer: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  addedAt: {
    fontSize: 12,
    color: '#64748B',
  },
  actionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeActionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeActionButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  // Enhanced Product Display Styles
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 20,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 16,
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
});

export default DiscountDetailsModal;