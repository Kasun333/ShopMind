import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ECOMMERCE_API_URL } from '../config/apiConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Product } from '../types/Product';
import { User } from '../types/User';
import { useCart } from '../hooks/useCart';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import ToastService from '../services/toastService';

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

  const BASE_URL = ECOMMERCE_API_URL;

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
          'Authorization': `Bearer ${token}`,
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
          const data: any = JSON.parse(responseText);
          console.log('Product data parsed:', data);
          
          // Map id to productId for consistency with frontend Product interface
          const mappedProduct: Product = {
            ...data,
            productId: data.id || data.productId
          };
          
          console.log('Mapped product with productId:', mappedProduct);
          setProduct(mappedProduct);
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
      // Show success toast with modern design
      ToastService.cart(
        '🛒 Added to Cart!',
        `${quantity} × ${product.name} added successfully`
      );
    } else {
      // Show error message
      ToastService.error('Cannot Add to Cart', result.message);
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
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#072033ff', '#2A7CC7', '#245e91ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingHeaderGradient}
        >
          <View style={styles.loadingHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.loadingHeaderTitle}>Product Details</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <ProductDetailSkeleton />
      </View>
    );
  }

  if (!product) {
    console.log('Product is null, showing error container');
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#072033ff', '#2A7CC7', '#245e91ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.errorBackground}
        />
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <MaterialCommunityIcons name="package-variant-closed-remove" size={80} color="#FFFFFF" />
          </View>
          <Text style={styles.errorTitle}>Product not found</Text>
          <Text style={styles.errorSubtitle}>The product you're looking for doesn't exist.</Text>
          <TouchableOpacity style={styles.errorBackButton} onPress={onBack}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.errorBackGradient}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backIcon} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.cartBadgeContainer}>
          {getCartItemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
            </View>
          )}
          <MaterialCommunityIcons name="cart-outline" size={24} color="#FFFFFF" />
        </View>
      </LinearGradient>

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
              <Ionicons name="image-outline" size={64} color="#94A3B8" />
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
              <MaterialCommunityIcons name="barcode" size={24} color="#2A7CC7" />
              <Text style={styles.quickInfoLabel}>Product ID</Text>
              <Text style={styles.quickInfoValue}>#{product.productId}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons name="package-variant" size={24} color={product.stock === 0 ? "#EF4444" : "#10B981"} />
              <Text style={styles.quickInfoLabel}>Stock</Text>
              <Text style={[styles.quickInfoValue, product.stock === 0 ? styles.stockEmpty : styles.stockAvailable]}>
                {product.stock === 0 ? 'Out' : product.stock}
              </Text>
            </View>
            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons name="shape" size={24} color="#2A7CC7" />
              <Text style={styles.quickInfoLabel}>Category</Text>
              <Text style={styles.quickInfoValue}>#{product.categoryId}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="text-box" size={22} color="#2A7CC7" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <View style={styles.descriptionCard}>
              <Text style={styles.productDescription}>
                {product.description || 'No description available for this product.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#2A7CC7" />
              <Text style={styles.sectionTitle}>Product Details</Text>
            </View>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialCommunityIcons name="identifier" size={18} color="#64748B" />
                  <Text style={styles.detailLabel}>Product ID:</Text>
                </View>
                <Text style={styles.detailValue}>{product.productId}</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialCommunityIcons name="shape-outline" size={18} color="#64748B" />
                  <Text style={styles.detailLabel}>Category ID:</Text>
                </View>
                <Text style={styles.detailValue}>{product.categoryId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  <Ionicons name="cash-outline" size={16} color="#6B7280" /> Unit Price:
                </Text>
                <Text style={styles.detailValue}>${product.price.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  <Ionicons name="cube-outline" size={16} color="#6B7280" /> Availability:
                </Text>
                <Text style={[styles.detailValue, product.stock === 0 ? styles.stockEmpty : styles.stockAvailable]}>
                  {product.stock === 0 ? 'Out of Stock' : `${product.stock} items available`}
                </Text>
              </View>
            </View>
          </View>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="calculator-outline" size={18} color="#2A7CC7" /> Quantity
              </Text>
              <View style={styles.quantityCard}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton} 
                    onPress={decreaseQuantity}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color="#2A7CC7" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton} 
                    onPress={increaseQuantity}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#2A7CC7" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityHelper}>Max: {product.stock} items</Text>
                {isProductInCart(product.productId) && (
                  <Text style={styles.inCartNotice}>
                    <Ionicons name="cart" size={14} color="#16A34A" /> {getProductQuantityInCart(product.productId)} already in cart
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Total Price */}
          {product.stock > 0 && (
            <View style={styles.totalContainer}>
              <LinearGradient
                colors={['rgba(42, 124, 199, 0.1)', 'rgba(59, 149, 227, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.totalGradient}
              >
                <View style={styles.totalContent}>
                  <Text style={styles.totalLabel}>
                    <Ionicons name="cash-outline" size={18} color="#2A7CC7" /> Total Amount:
                  </Text>
                  <Text style={styles.totalPrice}>${(product.price * quantity).toFixed(2)}</Text>
                </View>
                <Text style={styles.totalHelper}>{quantity} × ${product.price.toFixed(2)} per item</Text>
              </LinearGradient>
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
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={product.stock === 0 || cartLoading ? ['#9CA3AF', '#6B7280'] : ['#2A7CC7', '#1E6091']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addToCartGradient}
            >
              <Text style={styles.addToCartButtonText}>
                {cartLoading ? (
                  <><Ionicons name="hourglass-outline" size={18} color="#FFFFFF" /> Adding...</>
                ) : product.stock === 0 ? (
                  <><Ionicons name="close-circle-outline" size={18} color="#FFFFFF" /> Out of Stock</>
                ) : isProductInCart(product.productId) ? (
                  <><Ionicons name="cart" size={18} color="#FFFFFF" /> Add More to Cart</>
                ) : (
                  <><Ionicons name="cart-outline" size={18} color="#FFFFFF" /> Add to Cart</>
                )}
              </Text>
            </LinearGradient>
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
    backgroundColor: '#F8FAFC',
  },
  loadingHeaderGradient: {
    paddingTop: 0,
    paddingBottom: 16,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  loadingHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
  },
  errorBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorBackButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  errorBackGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartBadgeContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 6,
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
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  productImage: {
    width: '100%',
    height: 240,
  },
  productImagePlaceholder: {
    height: 240,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 12,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    marginBottom: 20,
  },
  productNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 32,
    flex: 1,
    marginRight: 12,
  },
  priceBadge: {
    backgroundColor: '#2A7CC7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#2A7CC7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickInfoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  stockEmpty: {
    color: '#EF4444',
  },
  stockAvailable: {
    color: '#10B981',
  },
  quantityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityHelper: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  inCartNotice: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    marginTop: 12,
    marginBottom: 80,
  },
  totalGradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A7CC7',
  },
  totalHelper: {
    fontSize: 12,
    color: '#64748B',
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  addToCartContainer: {
    width: '100%',
  },
  addToCartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToCartGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToCartButtonDisabled: {
    opacity: 0.8,
  },
});