import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { Product } from '../types/Product';
import { User } from '../types/User';
import { useCart } from '../hooks/useCart';

const { width, height } = Dimensions.get('window');

interface ProductDetailScreenProps {
  productId: number;
  user: User;
  token: string;
  onBack: () => void;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  user,
  token,
  onBack,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addToCartAnimation] = useState(new Animated.Value(1));
  
  // Use the cart hook
  const { 
    addToCart, 
    isProductInCart, 
    getProductQuantityInCart, 
    getCartItemCount,
    isLoading: cartLoading 
  } = useCart();

  const BASE_URL = 'http://10.10.31.7:8083';

  // Test network connectivity
  const testNetworkConnectivity = async () => {
    try {
      console.log('Testing basic network connectivity...');
      const response = await fetch('https://httpbin.org/json', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      console.log('Basic network test successful:', response.ok);
      return response.ok;
    } catch (error) {
      console.log('Basic network test failed:', error);
      return false;
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    setLoading(true);
    const apiUrl = `${BASE_URL}/api/products/${productId}`;
    
    console.log('Fetching product details for ID:', productId);
    console.log('API URL:', apiUrl);
    
    try {
      // First, let's try with a more explicit fetch configuration
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response received');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        try {
          const data: Product = JSON.parse(responseText);
          console.log('Product data parsed:', data);
          setProduct(data);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          Alert.alert('Error', 'Invalid response format from server');
        }
      } else {
        console.log('Response not ok. Status:', response.status, 'StatusText:', response.statusText);
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        Alert.alert('Error', `Failed to fetch product details (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      console.log('Error type:', typeof error);
      console.log('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          Alert.alert('Timeout Error', 'Request timed out. Please check your network connection.');
        } else if (error.message === 'Network request failed') {
          Alert.alert(
            'Network Error', 
            `Could not connect to server at ${BASE_URL}.\n\nTroubleshooting steps:\n1. Ensure server is running\n2. Check if you're using the correct IP address\n3. Try restarting the Metro bundler\n4. Check firewall settings`
          );
        } else {
          Alert.alert('Error', `Connection failed: ${error.message}`);
        }
      } else {
        Alert.alert('Error', 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeProductDetails = async () => {
      // First test basic network connectivity
      const networkOk = await testNetworkConnectivity();
      if (!networkOk) {
        console.log('Basic network connectivity failed');
        Alert.alert(
          'Network Issue', 
          'Basic network connectivity test failed. Please check your internet connection.'
        );
        setLoading(false);
        return;
      }
      
      // If basic network is ok, try to fetch product details
      await fetchProductDetails();
    };
    
    initializeProductDetails();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    // Show loading animation
    Animated.sequence([
      Animated.timing(addToCartAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addToCartAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add to cart using the cart service
    const result = await addToCart(product, quantity);

    if (result.success) {
      // Show success message
      Alert.alert(
        '🛒 Added to Cart!',
        result.message,
        [
          { 
            text: 'Continue Shopping', 
            style: 'default' 
          },
          { 
            text: 'View Cart', 
            style: 'default',
            onPress: () => {
              // You can navigate to cart here if needed
              console.log('Navigate to cart');
            }
          }
        ]
      );
    } else {
      // Show error message
      Alert.alert('❌ Cannot Add to Cart', result.message);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    } else if (product) {
      Alert.alert('Stock Limit', `Only ${product.stock} items available.`);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    console.log('Product is null, showing error container');
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😞</Text>
        <Text style={styles.errorTitle}>Product not found</Text>
        <Text style={styles.errorSubtitle}>The product you're looking for doesn't exist.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Rendering product details for:', product.name);
  console.log('Product details:', {
    name: product.name,
    price: product.price,
    description: product.description,
    stock: product.stock,
    imageUrl: product.imageUrl
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={onBack}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.cartBadgeContainer}>
          {getCartItemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
            </View>
          )}
          <Text style={styles.cartIcon}>🛒</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onError={() => console.log('Failed to load product image:', product.imageUrl)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageIcon}>📸</Text>
              <Text style={styles.noImageText}>No Image Available</Text>
            </View>
          )}
          {product.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockBadge}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Product Header with Price Badge */}
          <View style={styles.productHeader}>
            <View style={styles.productNameContainer}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.priceBadge}>
                <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          {/* Quick Info Cards */}
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoCard}>
              <Text style={styles.quickInfoIcon}>🏷️</Text>
              <Text style={styles.quickInfoLabel}>Product ID</Text>
              <Text style={styles.quickInfoValue}>#{product.productId}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <Text style={styles.quickInfoIcon}>📦</Text>
              <Text style={styles.quickInfoLabel}>Stock</Text>
              <Text style={[styles.quickInfoValue, product.stock === 0 ? styles.stockEmpty : styles.stockAvailable]}>
                {product.stock === 0 ? 'Out' : product.stock}
              </Text>
            </View>
            <View style={styles.quickInfoCard}>
              <Text style={styles.quickInfoIcon}>📂</Text>
              <Text style={styles.quickInfoLabel}>Category</Text>
              <Text style={styles.quickInfoValue}>#{product.categoryId}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.productDescription}>
                {product.description || 'No description available for this product.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Product Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🆔 Product ID:</Text>
                <Text style={styles.detailValue}>{product.productId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📁 Category ID:</Text>
                <Text style={styles.detailValue}>{product.categoryId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 Unit Price:</Text>
                <Text style={styles.detailValue}>${product.price.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📦 Availability:</Text>
                <Text style={[styles.detailValue, product.stock === 0 ? styles.stockEmpty : styles.stockAvailable]}>
                  {product.stock === 0 ? 'Out of Stock' : `${product.stock} items available`}
                </Text>
              </View>
            </View>
          </View>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔢 Quantity</Text>
              <View style={styles.quantityCard}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityHelper}>Max: {product.stock} items</Text>
                {isProductInCart(product.productId) && (
                  <Text style={styles.inCartNotice}>
                    📦 {getProductQuantityInCart(product.productId)} already in cart
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Total Price */}
          {product.stock > 0 && (
            <View style={styles.totalContainer}>
              <View style={styles.totalContent}>
                <Text style={styles.totalLabel}>💸 Total Amount:</Text>
                <Text style={styles.totalPrice}>${(product.price * quantity).toFixed(2)}</Text>
              </View>
              <Text style={styles.totalHelper}>{quantity} × ${product.price.toFixed(2)} per item</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <Animated.View style={[styles.addToCartContainer, { transform: [{ scale: addToCartAnimation }] }]}>
          <TouchableOpacity 
            style={[
              styles.addToCartButton, 
              (product.stock === 0 || cartLoading) && styles.addToCartButtonDisabled
            ]} 
            onPress={handleAddToCart}
            disabled={product.stock === 0 || cartLoading}
          >
            <Text style={[
              styles.addToCartButtonText, 
              (product.stock === 0 || cartLoading) && styles.addToCartButtonTextDisabled
            ]}>
              {cartLoading ? '⏳ Adding...' : 
               product.stock === 0 ? '❌ Out of Stock' : 
               isProductInCart(product.productId) ? '🛒 Add More to Cart' : '🛒 Add to Cart'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
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
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
  cartBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 280,
  },
  productImagePlaceholder: {
    height: 280,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageIcon: {
    fontSize: 80,
    color: '#94A3B8',
  },
  noImageText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 8,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 32,
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  productDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  stockEmpty: {
    color: '#DC2626',
  },
  stockAvailable: {
    color: '#16A34A',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    alignSelf: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addToCartContainer: {
    width: '100%',
  },
  addToCartButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addToCartButtonTextDisabled: {
    color: '#FFFFFF',
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
  // New styles for enhanced product details
  productHeader: {
    marginBottom: 20,
  },
  productNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  quickInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickInfoIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickInfoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quantityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  quantityHelper: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  inCartNotice: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalHelper: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
