import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, FlatList, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import MessagesScreen from './MessagesScreen';
import CartNavigation from '../navigation/CartNavigation';
import AccountScreen from './AccountScreen';
import ProductDetailScreen from './ProductDetailScreen';
import { User } from '../types/User';
import { Product, Category } from '../types/Product';

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
  const [cartItems, setCartItems] = useState<number>(0);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'product-detail'>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const categories: Category[] = [
    { id: 1, name: 'Electronics', icon: '📱' },
    { id: 2, name: 'Clothing', icon: '👕' },
    { id: 3, name: 'Home & Garden', icon: '🏠' },
    { id: 4, name: 'Sports', icon: '⚽' },
    { id: 5, name: 'Books', icon: '📚' },
    { id: 6, name: 'Food', icon: '🍔' },
  ];

  const BASE_URL = 'http://10.59.35.210:8082';

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (response.ok) {
        const data: any[] = await response.json();
        // Map id to productId for frontend compatibility
        const mappedProducts: Product[] = data.map(item => ({
          ...item,
          productId: item.id
        }));
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
        const mappedProducts: Product[] = data.map(item => ({
          ...item,
          productId: item.id
        }));
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

  const addToCart = (product: Product) => {
    setCartItems(prev => prev + 1);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart!`);
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

  // Render different screens based on active tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'messages':
        return <MessagesScreen user={user} token={token} />;
      case 'cart':
        return <CartNavigation user={user} token={token} />;
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
              onAddToCart={addToCart}
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
      
      <View style={styles.header}>
        <Text style={styles.title}>ShopMind</Text>
        <Text style={styles.subtitle}>Hello, {user.fullName}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
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
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === null && styles.categoryCardActive]}
              onPress={() => {
                setSelectedCategory(null);
                fetchProducts();
              }}
            >
              <Text style={styles.categoryIcon}>🏷️</Text>
              <Text style={[styles.categoryName, selectedCategory === null && styles.categoryNameActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={[styles.categoryCard, selectedCategory === category.id && styles.categoryCardActive]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, selectedCategory === category.id && styles.categoryNameActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Products` : 'All Products'}
            </Text>
            <Text style={styles.productCount}>({filteredProducts.length} items)</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
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
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity 
        style={styles.floatingCartButton}
        onPress={() => setActiveTab('cart')}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={styles.cartButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems}</Text>
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
    backgroundColor: '#FAFBFC',
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
    height: '37.5%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    marginBottom: 18,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    
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
  productCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryName: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#6366F1',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    width: (width - 44) / 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
  },
  productImagePlaceholder: {
    height: 120,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageIcon: {
    fontSize: 30,
    color: '#D1D5DB',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  outOfStockText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 15,
  },
  stockContainer: {
    marginBottom: 8,
  },
  stockText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stockTextEmpty: {
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  addToCartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  addToCartText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addToCartTextDisabled: {
    color: '#9CA3AF',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cartButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});