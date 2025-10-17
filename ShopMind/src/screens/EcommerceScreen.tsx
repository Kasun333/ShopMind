import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, FlatList, TextInput, Alert, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import MessagesScreen from './MessagesScreen';
import CartNavigation from '../navigation/CartNavigation';
import AccountScreen from './AccountScreen';
import ProductDetailScreen from './ProductDetailScreen';
import DiscountsScreen from './DiscountsScreen';
import ProductSkeleton from '../components/ProductSkeleton';
import { User } from '../types/User';
import { Product, Category } from '../types/Product';
import { useCart } from '../hooks/useCart';
import { ECOMMERCE_API_URL } from '../config/apiConfig';
import ToastService from '../services/toastService';

const { width } = Dimensions.get('window');

interface EcommerceScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const EcommerceScreen: React.FC<EcommerceScreenProps> = ({ user, token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'cart' | 'account'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentScreen, setCurrentScreen] = useState<'home' | 'product-detail' | 'discounts'>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Use cart hook for proper cart management
  const { addToCart: addToCartService, getCartItemCount } = useCart();

  const categories: Category[] = [
    { id: 1, name: 'Electronics', icon: '�' },
    { id: 2, name: 'Clothing', icon: '👕' },
    { id: 3, name: 'Home & Garden', icon: '�' },
    { id: 4, name: 'Sports', icon: '⚽' },
    { id: 5, name: 'Books', icon: '📚' },
    { id: 6, name: 'Food', icon: '🍔' },
  ];

  const BASE_URL = ECOMMERCE_API_URL;

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (response.ok) {
        const data: any[] = await response.json();
        console.log('Raw API response:', data);
        
        // Map backend response to frontend Product interface
        const mappedProducts: Product[] = data.map(item => {
          const mappedProduct: Product = {
            productId: item.productId,  // Use productId directly from API response
            name: item.name || '',
            description: item.description || '',
            imageUrl: item.imageUrl || item.image_url || '',
            stock: item.stock || 0,
            categoryId: item.categoryId || item.category_id || 0,
            price: item.price || 0
          };
          console.log('Mapped product:', mappedProduct);
          return mappedProduct;
        });
        setProducts(mappedProducts);
      } else {
        Alert.alert('Error', 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/products/category/${categoryId}`);
      if (response.ok) {
        const data: any[] = await response.json();
        console.log('Raw category API response:', data);
        
        // Map backend response to frontend Product interface
        const mappedProducts: Product[] = data.map(item => {
          const mappedProduct: Product = {
            productId: item.productId,  // Use productId directly from API response
            name: item.name || '',
            description: item.description || '',
            imageUrl: item.imageUrl || item.image_url || '',
            stock: item.stock || 0,
            categoryId: item.categoryId || item.category_id || 0,
            price: item.price || 0
          };
          console.log('Mapped category product:', mappedProduct);
          return mappedProduct;
        });
        setProducts(mappedProducts);
        setSelectedCategory(categoryId);
      } else {
        Alert.alert('Error', 'Failed to fetch category products');
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCategoryPress = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      // If same category is pressed, show all products
      setSelectedCategory(null);
      fetchProducts();
    } else {
      fetchProductsByCategory(categoryId);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      // Enhanced debug logging
      console.log('=== ADD TO CART DEBUG ===');
      console.log('Raw product object:', JSON.stringify(product, null, 2));
      console.log('Product ID:', product.productId);
      console.log('Product ID type:', typeof product.productId);
      console.log('Product keys:', Object.keys(product));
      console.log('Product values:', Object.values(product));
      
      // Validate product has required fields
      if (!product.productId) {
        console.error('❌ Product missing productId:', product);
        Alert.alert('Error', 'Product ID is missing. Please try refreshing the products.');
        return;
      }

      // Additional validation
      if (typeof product.productId !== 'number') {
        console.error('❌ Product ID is not a number:', product.productId, typeof product.productId);
        ToastService.error('Invalid Product', 'Product ID format is invalid. Please try refreshing.');
        return;
      }

      const result = await addToCartService(product, 1);
      if (result.success) {
        // Show modern toast notification for cart addition
        ToastService.cart(
          '🛒 Added to Cart!',
          `${product.name} has been added to your cart`
        );
      } else {
        ToastService.error('Cannot Add to Cart', result.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      ToastService.error('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const navigateToProductDetail = (productId: number) => {
    setSelectedProductId(productId);
    setCurrentScreen('product-detail');
  };

  const navigateBackToHome = () => {
    setCurrentScreen('home');
    setSelectedProductId(null);
  };

  const handleTabPress = (tab: 'home' | 'messages' | 'cart' | 'account') => {
    setActiveTab(tab);
    setCurrentScreen('home'); // Reset to home screen when changing tabs
  };

  const handleNavigateToEcommerce = () => {
    setActiveTab('home');
    setCurrentScreen('home');
  };

  // Render different screens based on active tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'messages':
        return <MessagesScreen user={user} token={token} />;
      case 'cart':
        return <CartNavigation user={user} token={token} onNavigateToEcommerce={handleNavigateToEcommerce} />;
      case 'account':
        return <AccountScreen user={user} token={token} onLogout={onLogout} />;
      default:
        if (currentScreen === 'product-detail' && selectedProductId) {
          return (
            <ProductDetailScreen
              productId={selectedProductId}
              user={user}
              token={token}
              onBack={navigateBackToHome}
            />
          );
        }
        if (currentScreen === 'discounts') {
          return (
            <DiscountsScreen
              user={user}
              onBack={navigateBackToHome}
            />
          );
        }
        return renderHomeScreen();
    }
  };

  const renderHomeScreen = () => (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundBox}
      />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ShopMind</Text>
            <Text style={styles.subtitle}>Hello, {user.fullName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color="rgba(255, 255, 255, 0.9)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              spellCheck={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Enhanced Discount Banner */}
        <View style={styles.discountBannerContainer}>
          <TouchableOpacity 
            style={styles.discountBanner}
            onPress={() => setCurrentScreen('discounts')}
            activeOpacity={0.85}
          >
            <View style={styles.discountGradient}>
              <View style={styles.discountIconContainer}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#EF4444" />
              </View>
              <View style={styles.discountContent}>
                <Text style={styles.discountTitle}>Special Offers 🎉</Text>
                <Text style={styles.discountSubtitle}>Grab exclusive deals today!</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === null && styles.categoryCardActive]}
              onPress={() => {
                setSelectedCategory(null);
                fetchProducts();
              }}
            >
              <View style={[styles.categoryIconContainer, selectedCategory === null && styles.categoryIconContainerActive]}>
                <Ionicons name="apps" size={17} color={selectedCategory === null ? '#FFFFFF' : '#6366F1'} />
              </View>
              <Text style={[styles.categoryName, selectedCategory === null && styles.categoryNameActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={[styles.categoryCard, selectedCategory === category.id && styles.categoryCardActive]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={[styles.categoryIconContainer, selectedCategory === category.id && styles.categoryIconContainerActive]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={[styles.categoryName, selectedCategory === category.id && styles.categoryNameActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Scrollable Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.productsSectionHeader}>
          <Text style={styles.productsSectionTitle}>
            {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name}` : 'All Products'}
          </Text>
          <View style={styles.productCount}>
            <Feather name="box" size={14} color="#6366F1" />
            <Text style={styles.productCountText}>{filteredProducts.length}</Text>
          </View>
        </View>
        
        {loading ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsGrid}
          >
            <View style={styles.skeletonRow}>
              <ProductSkeleton />
              <ProductSkeleton />
            </View>
            <View style={styles.skeletonRow}>
              <ProductSkeleton />
              <ProductSkeleton />
            </View>
          </ScrollView>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or category filter</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => (
              <ProductCard 
                product={item} 
                onAddToCart={addToCart}
                onProductPress={navigateToProductDetail}
              />
            )}
            keyExtractor={(item) => item.productId !== undefined ? item.productId.toString() : `product-${Math.random()}`}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsListContent}
          />
        )}
      </View>

      {/* Floating Cart Button */}
      <TouchableOpacity 
        style={styles.floatingCartButton}
        onPress={() => setActiveTab('cart')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={styles.cartButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          {getCartItemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Product Card Component
  const ProductCard: React.FC<{ 
    product: Product; 
    onAddToCart: (product: Product) => void;
    onProductPress: (productId: number) => void;
  }> = ({ product, onAddToCart, onProductPress }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => onProductPress(product.productId !== undefined ? product.productId : -1)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => console.log('Failed to load image:', product.imageUrl)}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageIcon}>📸</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
        <View style={styles.stockContainer}>
          <Text style={[styles.stockText, product.stock === 0 && styles.stockTextEmpty]}>
            {product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
          </Text>
        </View>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          <TouchableOpacity 
            style={[styles.addToCartButton, product.stock === 0 && styles.addToCartButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card press
              if (product.stock > 0) {
                onAddToCart(product);
              } else {
                Alert.alert('Out of Stock', 'This product is currently unavailable.');
              }
            }}
            disabled={product.stock === 0}
          >
            <LinearGradient
              colors={product.stock === 0 ? ['#F3F4F6', '#F3F4F6'] : ['#1F2937', '#374151']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.addToCartText, product.stock === 0 && styles.addToCartTextDisabled]}>
                {product.stock === 0 ? '✗' : '+'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      {renderScreen()}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

export default EcommerceScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 0,
  },
  fixedHeader: {
    backgroundColor: 'transparent',
    paddingBottom: 8,
    zIndex: 1,
  },
  header: {
    paddingTop: 35,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  discountBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  discountBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  discountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  discountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  discountContent: {
    flex: 1,
    marginLeft: 10,
  },
  discountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  discountSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoriesSection: {
    paddingBottom: 10,
  },
  categoriesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  categoriesContainer: {
    paddingLeft: 20,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 65,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryIconContainerActive: {
    backgroundColor: '#6366F1',
  },
  categoryEmoji: {
    fontSize: 17,
  },
  categoryName: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#6366F1',
  },
  productsSection: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 16,
    marginTop: -12,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  productCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  productCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  productsGrid: {
    paddingBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productsListContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    width: (width - 44) / 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 130,
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    height: 130,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageIcon: {
    fontSize: 36,
    color: '#D1D5DB',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  outOfStockText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 13,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 19,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 16,
  },
  stockContainer: {
    marginBottom: 10,
  },
  stockText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stockTextEmpty: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  addToCartButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  addToCartText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  addToCartTextDisabled: {
    color: '#9CA3AF',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: 'rgba(99, 102, 241, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cartButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  // Deprecated styles (kept for backward compatibility)
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  discountsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  discountsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  discountsInfo: {
    flex: 1,
  },
  discountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  discountsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  discountsArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  cartIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  searchIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
});