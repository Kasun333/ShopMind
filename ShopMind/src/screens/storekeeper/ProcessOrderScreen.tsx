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
} from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
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
  // scannedItems: { [orderItemId]: boolean }
  const [scannedItems, setScannedItems] = useState<{[key: number]: boolean}>({});
  // scannedBarcodes: { [orderItemId]: string | null }
  const [scannedBarcodes, setScannedBarcodes] = useState<{[key: number]: string | null}>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentScanningItem, setCurrentScanningItem] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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

  const handleFollow = () => {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderNumber}>Order #{order.orderId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
              <Text style={styles.customerName}>Customer: {order.customerName}</Text>
              <Text style={styles.totalAmount}>Total: ${order.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.orderItems.map((item) => (
              <View key={item.orderItemId} style={styles.itemCard}>
                <Image source={{ uri: item.productImageUrl }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>Qty: {item.quantity} | ${item.price.toFixed(2)} each</Text>
                  <Text style={styles.itemTotal}>Total: ${(item.price * item.quantity).toFixed(2)}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Barcode: {item.barcode || 'N/A'}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={{ color: '#059669', fontSize: 16, textAlign: 'center', marginTop: 16 }}>This order has already been processed.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  // ...existing code...
};

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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 60,
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
  orderInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
  },
  itemActions: {
    marginLeft: 12,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scannedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scannedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonTextDisabled: {
    color: '#9CA3AF',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  cancelScanText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  cameraView: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  cameraInstructions: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 32,
    textAlign: 'center',
  },
  testButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  testScanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessOrderScreen;