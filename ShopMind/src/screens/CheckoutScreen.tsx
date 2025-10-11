import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../hooks/useCart';
import { User } from '../types/User';
import { stripeService, CreatePaymentIntentRequest } from '../services/stripeService';
import { Discount } from '../types/Discount';

interface CheckoutScreenProps {
  user: User;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  user,
  onBack,
  onPaymentSuccess,
}) => {
  const { confirmPayment } = useStripe();
  const { 
    cartItems, 
    cartSummary, 
    cartSummaryWithDiscount,
    clearCart,
    applyDiscount,
    removeDiscount,
    getApplicableDiscounts,
    getAppliedDiscount
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardFieldComplete, setCardFieldComplete] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  
  // Discount state
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const appliedDiscountInfo = getAppliedDiscount();

  // Load available discounts when component mounts
  useEffect(() => {
    loadAvailableDiscounts();
  }, []);

  const loadAvailableDiscounts = async () => {
    try {
      const discounts = await getApplicableDiscounts();
      setAvailableDiscounts(discounts);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  const handleApplyDiscount = async (code?: string) => {
    const codeToApply = code || discountCode;
    if (!codeToApply.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const result = await applyDiscount(codeToApply, parseInt(user.id));
      if (result.success) {
        Alert.alert('Success', result.message);
        setDiscountCode('');
        setShowDiscountModal(false);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      Alert.alert('Error', 'Failed to apply discount. Please try again.');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    Alert.alert('Success', 'Discount removed');
  };

  // Check if cart is empty
  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some items to your cart before checkout</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePayment = async () => {
    if (!cardFieldComplete) {
      Alert.alert('Incomplete Card Details', 'Please fill in all card details');
      return;
    }

    setIsProcessing(true);

    try {
      // Validate cart items have productIds
      const invalidItems = cartItems.filter(item => !item.productId);
      if (invalidItems.length > 0) {
        console.error('Cart items missing productId:', invalidItems);
        Alert.alert('Cart Error', 'Some items in your cart are missing product information. Please refresh and try again.');
        return;
      }

      // Step 1: Create payment intent on backend
      const finalAmount = appliedDiscountInfo.discount 
        ? cartSummaryWithDiscount.total 
        : cartSummary.total;
      
      const paymentRequest: CreatePaymentIntentRequest = {
        amount: Math.round(finalAmount * 100), // Convert to cents
        currency: 'usd',
        customerId: parseInt(user.id),
        orderItems: cartItems.map(item => ({
          productId: item.productId,
          barcode: item.productId.toString(), // Use productId as barcode if not available
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        // Add discount information if applied
        ...(appliedDiscountInfo.discount && {
          discountCode: appliedDiscountInfo.discount.discountCode,
          discountAmount: appliedDiscountInfo.amount,
        }),
      };

      console.log('Creating payment intent with request:', paymentRequest);
      console.log('Cart items with orderItems mapping:', cartItems.map(item => ({ 
        name: item.name, 
        productId: item.productId, 
        quantity: item.quantity, 
        unitPrice: item.price 
      })));

      const paymentIntentResult = await stripeService.createPaymentIntent(paymentRequest);

      if (!paymentIntentResult.success || !paymentIntentResult.paymentIntent) {
        Alert.alert(
          'Payment Error',
          paymentIntentResult.error || 'Failed to create payment intent'
        );
        return;
      }

      const { paymentIntent, orderId } = paymentIntentResult;
      setCurrentOrderId(orderId || null);

      console.log('Payment intent created:', paymentIntent);

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await confirmPayment(paymentIntent.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert(
          'Payment Failed',
          error.message || 'Payment could not be processed'
        );
        return;
      }

      if (confirmedPaymentIntent?.status === 'Succeeded') {
        console.log('Payment succeeded:', confirmedPaymentIntent);

        // Step 3: Confirm payment on backend (update order status, create invoice, etc.)
        if (orderId && confirmedPaymentIntent.id && confirmedPaymentIntent.paymentMethodId) {
          const confirmResult = await stripeService.confirmPayment(
            orderId,
            confirmedPaymentIntent.id,
            confirmedPaymentIntent.paymentMethodId
          );

          if (confirmResult.success) {
            // Payment successful - clear cart and show success
            await clearCart();
            
            Alert.alert(
              '🎉 Payment Successful!',
              'Your order has been placed successfully. You will receive a confirmation email shortly.',
              [
                {
                  text: 'Continue Shopping',
                  onPress: onPaymentSuccess,
                },
              ]
            );
          } else {
            Alert.alert(
              'Payment Processing Error',
              'Payment was successful but there was an issue processing your order. Please contact support.'
            );
          }
        }
      } else {
        Alert.alert(
          'Payment Incomplete',
          'Payment was not completed. Please try again.'
        );
      }
    } catch (error) {
      console.error('Payment process error:', error);
      Alert.alert(
        'Payment Error',
        'An unexpected error occurred during payment processing'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={onBack}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Order Summary</Text>
          <View style={styles.orderSummaryCard}>
            {cartItems.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)} × {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Discount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Discounts</Text>
          <View style={styles.discountCard}>
            {appliedDiscountInfo.discount ? (
              <View style={styles.appliedDiscountContainer}>
                <View style={styles.appliedDiscountInfo}>
                  <Text style={styles.appliedDiscountName}>
                    {appliedDiscountInfo.discount.discountName}
                  </Text>
                  <Text style={styles.appliedDiscountCode}>
                    {appliedDiscountInfo.discount.discountCode}
                  </Text>
                  <Text style={styles.appliedDiscountSavings}>
                    You save: ${appliedDiscountInfo.amount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeDiscountButton}
                  onPress={handleRemoveDiscount}
                >
                  <Text style={styles.removeDiscountText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity 
                  style={styles.discountButton}
                  onPress={() => setShowDiscountModal(true)}
                >
                  <Text style={styles.discountButtonText}>Apply Discount Code</Text>
                </TouchableOpacity>
                {availableDiscounts.length > 0 && (
                  <Text style={styles.availableDiscountsText}>
                    {availableDiscounts.length} discount{availableDiscounts.length > 1 ? 's' : ''} available for this order
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cartSummary.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${cartSummary.shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${cartSummary.tax.toFixed(2)}</Text>
            </View>
            {appliedDiscountInfo.discount && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -${appliedDiscountInfo.amount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${(appliedDiscountInfo.discount ? cartSummaryWithDiscount.total : cartSummary.total).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Name:</Text>
              <Text style={styles.customerValue}>{user.username}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Email:</Text>
              <Text style={styles.customerValue}>{user.email}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone:</Text>
              <Text style={styles.customerValue}>{user.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentLabel}>Card Information</Text>
            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardFieldComplete(cardDetails.complete);
              }}
            />
            <Text style={styles.secureText}>🔒 Your payment information is secure</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!cardFieldComplete || isProcessing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!cardFieldComplete || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.processingText}>Processing Payment...</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>
              Pay ${(appliedDiscountInfo.discount ? cartSummaryWithDiscount.total : cartSummary.total).toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Discount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDiscountModal}
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Discount</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDiscountModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Code Entry */}
            <View style={styles.codeInputSection}>
              <Text style={styles.codeInputLabel}>Enter Discount Code</Text>
              <TextInput
                style={styles.codeInput}
                value={discountCode}
                onChangeText={setDiscountCode}
                placeholder="Enter discount code"
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={[styles.applyCodeButton, isApplyingDiscount && styles.disabledButton]}
                onPress={() => handleApplyDiscount()}
                disabled={isApplyingDiscount}
              >
                {isApplyingDiscount ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyCodeButtonText}>Apply Code</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Available Discounts */}
            {availableDiscounts.length > 0 && (
              <View style={styles.availableDiscountsSection}>
                <Text style={styles.availableDiscountsTitle}>Available Discounts</Text>
                <ScrollView style={styles.discountsList}>
                  {availableDiscounts.map((discount) => (
                    <TouchableOpacity 
                      key={discount.id}
                      style={styles.discountItem}
                      onPress={() => handleApplyDiscount(discount.discountCode)}
                    >
                      <View style={styles.discountItemLeft}>
                        <Text style={styles.discountItemName}>{discount.discountName}</Text>
                        <Text style={styles.discountItemCode}>{discount.discountCode}</Text>
                        <Text style={styles.discountItemDescription}>{discount.description}</Text>
                      </View>
                      <View style={styles.discountItemRight}>
                        <Text style={styles.discountItemValue}>
                          {discount.isPercentage 
                            ? `${discount.discountValue}% OFF` 
                            : `$${discount.discountValue} OFF`
                          }
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748B',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customerLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  customerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  secureText: {
    fontSize: 12,
    color: '#16A34A',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomAction: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Discount styles
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  appliedDiscountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedDiscountInfo: {
    flex: 1,
  },
  appliedDiscountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  appliedDiscountCode: {
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  appliedDiscountSavings: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  removeDiscountButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeDiscountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  discountButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  discountButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  availableDiscountsText: {
    fontSize: 12,
    color: '#16A34A',
    textAlign: 'center',
  },
  discountLabel: {
    color: '#16A34A',
  },
  discountValue: {
    color: '#16A34A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
  },
  codeInputSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  codeInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 12,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  applyCodeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  applyCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  availableDiscountsSection: {
    padding: 20,
  },
  availableDiscountsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 12,
  },
  discountsList: {
    maxHeight: 200,
  },
  discountItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  discountItemLeft: {
    flex: 1,
  },
  discountItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  discountItemCode: {
    fontSize: 12,
    color: '#16A34A',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  discountItemDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  discountItemRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  discountItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
});
