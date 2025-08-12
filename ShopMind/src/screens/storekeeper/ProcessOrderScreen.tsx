import React, { useState, useEffect } from 'react';
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
import { Order } from '../../types/Order';
import { User } from '../../types/User';

const { width, height } = Dimensions.get('window');

interface ProcessOrderScreenProps {
  user: User;
  token: string;
  order: Order;
  onBack: () => void;
}

const ProcessOrderScreen: React.FC<ProcessOrderScreenProps> = ({ user, token, order, onBack }) => {
  const [scannedItems, setScannedItems] = useState<{[key: number]: boolean}>({});
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentScanningItem, setCurrentScanningItem] = useState<number | null>(null);

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

  const handleBarcodeScanned = (data: string) => {
    // For now, just mark the item as scanned
    // You can integrate actual barcode validation logic later
    if (currentScanningItem) {
      setScannedItems(prev => ({
        ...prev,
        [currentScanningItem]: true
      }));
      
      Alert.alert(
        'Barcode Scanned Successfully!',
        `Product barcode: ${data}`,
        [{ text: 'OK' }]
      );
    }
    
    setShowBarcodeScanner(false);
    setCurrentScanningItem(null);
  };

  const handleCancelScan = () => {
    setShowBarcodeScanner(false);
    setCurrentScanningItem(null);
  };

  const allItemsScanned = order.orderItems.every(item => scannedItems[item.orderItemId]);

  const handleCompleteOrder = () => {
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
          onPress: () => {
            // TODO: Update order status in backend
            Alert.alert('Success', 'Order marked as ready for delivery!');
            onBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Process Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.orderInfoCard}>
            <Text style={styles.orderNumber}>#ORD-{order.orderId}</Text>
            <Text style={styles.orderDate}>Placed: {formatDate(order.orderDate)}</Text>
            <Text style={styles.customerName}>{order.customerName || `Customer ${order.customerId}`}</Text>
            <Text style={styles.totalAmount}>Total: ${order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Items to Scan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Items to Scan ({Object.keys(scannedItems).length}/{order.orderItems.length})
          </Text>
          
          {order.orderItems.map((item) => {
            const isScanned = scannedItems[item.orderItemId];
            return (
              <View key={item.orderItemId} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>
                    Qty: {item.quantity} | ${item.price.toFixed(2)} each
                  </Text>
                  <Text style={styles.itemTotal}>
                    Total: ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.itemActions}>
                  {isScanned ? (
                    <View style={styles.scannedBadge}>
                      <Text style={styles.scannedText}>✓ Scanned</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={() => handleScanBarcode(item.orderItemId)}
                    >
                      <Text style={styles.scanButtonText}>📷 Scan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(Object.keys(scannedItems).length / order.orderItems.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Object.keys(scannedItems).length} of {order.orderItems.length} items scanned
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Complete Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            !allItemsScanned && styles.completeButtonDisabled
          ]}
          onPress={handleCompleteOrder}
          disabled={!allItemsScanned}
        >
          <Text style={[
            styles.completeButtonText,
            !allItemsScanned && styles.completeButtonTextDisabled
          ]}>
            {allItemsScanned ? '✓ Complete Order' : 'Scan All Items First'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScanner}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={handleCancelScan}>
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Camera Placeholder - You'll integrate actual camera here */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>📷</Text>
            <Text style={styles.cameraInstructions}>
              Camera view will appear here
            </Text>
            <Text style={styles.cameraSubtext}>
              Point camera at product barcode
            </Text>
            
            {/* Test Scan Button for Development */}
            <TouchableOpacity
              style={styles.testScanButton}
              onPress={() => handleBarcodeScanned('TEST_BARCODE_12345')}
            >
              <Text style={styles.testScanButtonText}>Test Scan (Development)</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
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
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  cameraPlaceholderText: {
    fontSize: 64,
    marginBottom: 16,
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
  testScanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessOrderScreen;
