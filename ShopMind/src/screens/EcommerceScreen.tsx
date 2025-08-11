import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, FlatList, TextInput, Alert, Image } from 'react-native';
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

  const BASE_URL = 'http://10.10.31.7:8083';

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (response.ok) {
        const data: Product[] = await response.json();
        setProducts(data);
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
        const data: Product[] = await response.json();
        setProducts(data);
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
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
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
              <ActivityIndicator size="large" color="#3B82F6" />
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
              keyExtractor={(item) => item.productId.toString()}
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
        <Text style={styles.cartIcon}>🛒</Text>
        {cartItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItems}</Text>
          </View>
        )}
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
      onPress={() => onProductPress(product.productId)}
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
            <Text style={[styles.addToCartText, product.stock === 0 && styles.addToCartTextDisabled]}>
              {product.stock === 0 ? '✗' : '+'}
            </Text>
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 30,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    color: '#94A3B8',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  productCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 90,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#3B82F6',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: (width - 52) / 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  productImagePlaceholder: {
    height: 120,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  productImageIcon: {
    fontSize: 32,
    color: '#94A3B8',
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
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  stockContainer: {
    marginBottom: 8,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#16A34A',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    color: '#3B82F6',
  },
  addToCartButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartTextDisabled: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cartIcon: {
    fontSize: 24,
    color: '#FFFFFF',
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
