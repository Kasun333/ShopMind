import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import restockService, { ScannedProduct, RestockResponse } from '../services/restockService';

const { width, height } = Dimensions.get('window');

interface RestockModalProps {
  visible: boolean;
  onClose: () => void;
  onRestockSuccess: (result: RestockResponse) => void;
  token: string;
}

const RestockModal: React.FC<RestockModalProps> = ({
  visible,
  onClose,
  onRestockSuccess,
  token
}) => {
  const [step, setStep] = useState<'scan' | 'manual' | 'quantity' | 'confirm'>('scan');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
    } else {
      Alert.alert('Permission Required', 'Camera permission is required for barcode scanning');
    }
  };

  // Handle barcode scan
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    console.log('📱 Barcode scanned:', { type, data });
    setShowScanner(false);
    await handleBarcodeInput(data);
  };

  // Handle barcode input (scan or manual)
  const handleBarcodeInput = async (barcode: string) => {
    if (!restockService.validateBarcode(barcode)) {
      Alert.alert(
        'Invalid Barcode Format', 
        'Please enter a valid product barcode.\nFormat: PRD-YYYYMMDDHHMMSS-username'
      );
      return;
    }

    setLoading(true);
    try {
      const product = await restockService.getProductByBarcode(barcode, token);
      if (product) {
        setScannedProduct(product);
        setStep('quantity');
      } else {
        Alert.alert(
          'Product Not Found', 
          `No product found with barcode:\n${barcode}\n\nPlease check:\n• Barcode is correct\n• Product exists in system\n• Try scanning again`
        );
        setStep('scan');
      }
    } catch (error: any) {
      console.error('Error scanning barcode:', error);
      
      let errorMessage = 'Failed to scan barcode. Please try again.';
      
      if (error.message?.includes('404')) {
        errorMessage = `Product not found with this barcode:\n${barcode}\n\nThe product may not exist in the system or the barcode might be incorrect.`;
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Scanning Failed', errorMessage);
      setStep('scan');
    } finally {
      setLoading(false);
    }
  };

  // Handle restock
  const handleRestock = async () => {
    if (!scannedProduct || !quantity || parseInt(quantity) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const result = await restockService.restockProduct(
        scannedProduct.productId,
        parseInt(quantity),
        token
      );
      
      if (result) {
        onRestockSuccess(result);
        handleClose();
        Alert.alert(
          'Success', 
          `Successfully restocked ${result.quantityAdded} units of ${result.productName}`
        );
      } else {
        Alert.alert('Error', 'Failed to restock product');
      }
    } catch (error) {
      console.error('Error restocking:', error);
      Alert.alert('Error', 'Failed to restock product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setStep('scan');
    setScannedProduct(null);
    setManualBarcode('');
    setQuantity('');
    setShowScanner(false);
    onClose();
  };

  // Render scanner step
  const renderScanStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Restock Product</Text>
      <Text style={styles.stepDescription}>Choose how to identify the product</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={requestCameraPermission}
          disabled={loading}
        >
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.optionGradient}
          >
            <Ionicons name="scan-outline" size={32} color="white" />
            <Text style={styles.optionText}>Scan Barcode</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => setStep('manual')}
          disabled={loading}
        >
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            style={styles.optionGradient}
          >
            <Ionicons name="create-outline" size={32} color="white" />
            <Text style={styles.optionText}>Enter Manually</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render manual input step
  const renderManualStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Barcode</Text>
      <Text style={styles.stepDescription}>Type or paste the product barcode</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Product Barcode</Text>
        <TextInput
          style={styles.textInput}
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder="PRD-20250812015746-hasitha"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helpText}>
          💡 Try these example barcodes for testing:{'\n'}
          • PRD-20250812015746-hasitha{'\n'}
          • PRD-20250827140525-hasitha{'\n'}
          • PRD-20250909112027-hasitha
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => setStep('scan')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => handleBarcodeInput(manualBarcode)}
          disabled={loading || !manualBarcode}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render quantity step
  const renderQuantityStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Product Found</Text>
      <Text style={styles.stepDescription}>Enter quantity to restock</Text>

      {scannedProduct && (
        <View style={styles.productCard}>
          <Image source={{ uri: scannedProduct.imageUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{scannedProduct.name}</Text>
            <Text style={styles.productCategory}>{scannedProduct.categoryName}</Text>
            <Text style={styles.productBarcode}>
              {restockService.formatBarcodeDisplay(scannedProduct.barcode)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.stockInfo}>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Current Stock</Text>
          <Text style={styles.stockValue}>{scannedProduct?.currentStock || 0}</Text>
        </View>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Available Stock</Text>
          <Text style={styles.stockValue}>{scannedProduct?.availableStock || 0}</Text>
        </View>
        <View style={styles.stockItem}>
          <Text style={styles.stockLabel}>Reserved Stock</Text>
          <Text style={styles.stockValue}>{scannedProduct?.reservedStock || 0}</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Quantity to Add</Text>
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => setStep('scan')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleRestock}
          disabled={loading || !quantity || parseInt(quantity) <= 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Restock</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render barcode scanner
  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <CameraView
        style={styles.scanner}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "code128", "code39", "code93", "codabar", "ean13", "ean8", "upc_a", "upc_e"],
        }}
      />
      
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>Scan Product Barcode</Text>
          <TouchableOpacity onPress={() => setShowScanner(false)}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scannerFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>
        
        <Text style={styles.scannerInstruction}>
          Point your camera at the product barcode
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#047857', '#059669']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Restock Product</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {showScanner ? renderScanner() : (
          <View style={styles.content}>
            {step === 'scan' && renderScanStep()}
            {step === 'manual' && renderManualStep()}
            {step === 'quantity' && renderQuantityStep()}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'monospace',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  stockInfo: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#059669',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scannerContainer: {
    flex: 1,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 20,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  scannerFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#10B981',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: '#10B981',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#10B981',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#10B981',
  },
  scannerInstruction: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    paddingBottom: 40,
  },
});

export default RestockModal;
