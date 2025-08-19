import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/Order';
import { User } from '../../types/User';
import { orderService } from '../../services/orderService';

const { width, height } = Dimensions.get('window');

interface ProcessOrderScreenProps {
  user: User;
  token: string;
  order: Order;
  onBack: () => void;
}

const ProcessOrderScreen: React.FC<ProcessOrderScreenProps> = ({ user, token, order, onBack }) => {
  console.log('🔧 ProcessOrderScreen: Component is being rendered for order:', order.orderId);
  
  // scannedItems: { [orderItemId]: boolean }
  const [scannedItems, setScannedItems] = useState<{[key: number]: boolean}>({});
  // scannedBarcodes: { [orderItemId]: string | null }
  const [scannedBarcodes, setScannedBarcodes] = useState<{[key: number]: string | null}>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentScanningItem, setCurrentScanningItem] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const currentDateTime = "2025-08-18 18:45:48";
  const currentUser = "Kasun333";

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleScanBarcode = (itemId: number) => {
    setCurrentScanningItem(itemId);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (currentScanningItem != null) {
      const item = order.orderItems.find(i => i.orderItemId === currentScanningItem);
      if (!item) return;
      // If barcode is null, allow any scan
      if (!item.barcode || item.barcode === data) {
        setScannedItems(prev => ({ ...prev, [currentScanningItem]: true }));
        setScannedBarcodes(prev => ({ ...prev, [currentScanningItem]: data }));
        setScanError(null);
        Alert.alert('Barcode Scanned!', `Product: ${item.productName}\nBarcode: ${data}`);
        setShowBarcodeScanner(false);
        setCurrentScanningItem(null);
      } else {
        setScanError(`Scanned barcode does not match for ${item.productName}.`);
      }
    }
  };

  const handleCancelScan = () => {
    setShowBarcodeScanner(false);
    setCurrentScanningItem(null);
    setScanError(null);
  };

  // If quantity > 1, allow scanning once and mark all
  const allItemsScanned = order.orderItems.every(item => scannedItems[item.orderItemId]);

  const handleCompleteOrder = async () => {
    if (!allItemsScanned) {
      Alert.alert(
        'Incomplete Scanning',
        'Please scan all items before completing the order.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Order',
      'Mark this order as ready for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await orderService.processOrder(order.orderId, token);
              Alert.alert('Success', 'Order marked as ready for delivery!');
              onBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to update order status.');
            }
          }
        }
      ]
    );
  };

  // If processed, show only details
  if (order.status === 'PROCESSED') {
    return (
      <View style={styles.rootContainer}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        
        <LinearGradient
          colors={['#047857', '#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerSafe}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Order Details</Text>
              <View style={styles.placeholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle-outline" size={20} color="#047857" style={styles.sectionIcon} />
              Order Details
            </Text>
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderNumber}>Order #{order.orderId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
              <Text style={styles.customerName}>
                <Ionicons name="person-outline" size={16} color="#64748B" /> {order.customerName}
              </Text>
              <Text style={styles.totalAmount}>
                <Ionicons name="cash-outline" size={16} color="#047857" /> ${order.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list-outline" size={20} color="#047857" style={styles.sectionIcon} />
              Items
            </Text>
            {order.orderItems.map((item) => (
              <View key={item.orderItemId} style={styles.itemCard}>
                <Image 
                  source={{ uri: item.productImageUrl }} 
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>
                    <Ionicons name="cube-outline" size={14} color="#64748B" /> Qty: {item.quantity} | ${item.price.toFixed(2)} each
                  </Text>
                  <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                  <Text style={styles.barcodeText}>
                    <Ionicons name="barcode-outline" size={14} color="#64748B" /> {item.barcode || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.processedContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.processedGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={32} color="#059669" />
              <Text style={styles.processedText}>This order has already been processed.</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              <Ionicons name="time-outline" size={12} color="#64748B" /> {currentDateTime}
            </Text>
            <Text style={styles.footerText}>
              <Ionicons name="person-outline" size={12} color="#64748B" /> {currentUser}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // For non-processed orders, show the scanning interface
  return (
    <View style={styles.rootContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      <LinearGradient
        colors={['#047857', '#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Process Order #{order.orderId}</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle-outline" size={20} color="#047857" style={styles.sectionIcon} />
            Order Details
          </Text>
          <View style={styles.orderInfoCard}>
            <Text style={styles.orderNumber}>Order #{order.orderId}</Text>
            <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
            <Text style={styles.customerName}>
              <Ionicons name="person-outline" size={16} color="#64748B" /> {order.customerName}
            </Text>
            <Text style={styles.totalAmount}>
              <Ionicons name="cash-outline" size={16} color="#047857" /> ${order.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="barcode-outline" size={20} color="#047857" style={styles.sectionIcon} />
            Scan Items ({Object.keys(scannedItems).length}/{order.orderItems.length})
          </Text>
          
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={20} color="#059669" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>Tap "Scan" to scan each item's barcode</Text>
          </View>
          
          {order.orderItems.map((item) => (
            <View key={item.orderItemId} style={[
              styles.itemCard,
              scannedItems[item.orderItemId] && styles.scannedItemCard
            ]}>
              <Image 
                source={{ uri: item.productImageUrl }} 
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemDetails}>
                  <Ionicons name="cube-outline" size={14} color="#64748B" /> Qty: {item.quantity} | ${item.price.toFixed(2)} each
                </Text>
                <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                {scannedBarcodes[item.orderItemId] ? (
                  <Text style={styles.scannedBarcode}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" /> Scanned: {scannedBarcodes[item.orderItemId]}
                  </Text>
                ) : (
                  <Text style={styles.barcodeText}>
                    <Ionicons name="barcode-outline" size={14} color="#64748B" /> {item.barcode || 'N/A'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.scanButtonContainer}
                onPress={() => handleScanBarcode(item.orderItemId)}
                disabled={scannedItems[item.orderItemId]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={scannedItems[item.orderItemId] 
                    ? ['#10B981', '#059669'] 
                    : ['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scanButtonGradient}
                >
                  {scannedItems[item.orderItemId] ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {allItemsScanned && (
          <TouchableOpacity 
            style={styles.completeButtonContainer}
            onPress={handleCompleteOrder}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" style={styles.completeButtonIcon} />
              <Text style={styles.completeButtonText}>Complete Order Processing</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            <Ionicons name="time-outline" size={12} color="#64748B" /> {currentDateTime}
          </Text>
          <Text style={styles.footerText}>
            <Ionicons name="person-outline" size={12} color="#64748B" /> {currentUser}
          </Text>
        </View>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={showBarcodeScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <LinearGradient
            colors={['#047857', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scannerHeader}
          >
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelScan}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={styles.placeholder} />
          </LinearGradient>
          
          {hasPermission === false ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color="#047857" style={{marginBottom: 16}} />
              <Text style={styles.permissionText}>Camera permission is required to scan barcodes</Text>
              <TouchableOpacity style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstructions}>
                  Position the barcode within the frame
                </Text>
                {scanError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{scanError}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  orderInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  instructionCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionIcon: {
    marginRight: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  scannedItemCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 2,
  },
  barcodeText: {
    fontSize: 12,
    color: '#64748B',
  },
  scanButtonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 8,
  },
  scanButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scannedBarcode: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  completeButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonIcon: {
    marginRight: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight as number + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: 300,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 30,
  },
  permissionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processedContainer: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  processedGradient: {
    padding: 20,
    alignItems: 'center',
  },
  processedText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginTop: 8,
  },
  footerInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
});

export default ProcessOrderScreen;