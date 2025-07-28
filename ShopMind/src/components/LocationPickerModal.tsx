import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 6.9271, // Default to Colombo, Sri Lanka
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [previewAddress, setPreviewAddress] = useState<string>('');

  // Request location permissions when modal opens
  useEffect(() => {
    if (visible) {
      requestLocationPermission();
      setPreviewAddress('');
      setSelectedLocation(null);
    }
  }, [visible]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use the map feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setPreviewAddress('Getting address...');
    
    // Get preview address (don't wait for it)
    tryNominatimGeocoding(latitude, longitude).then(address => {
      if (address && !address.includes('Error:')) {
        setPreviewAddress(address);
      } else {
        setPreviewAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    }).catch(() => {
      setPreviewAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('Starting reverse geocoding for:', latitude, longitude);
      
      // Try OpenStreetMap Nominatim API first
      const nominatimResult = await tryNominatimGeocoding(latitude, longitude);
      if (nominatimResult && !nominatimResult.includes('Error:')) {
        return nominatimResult;
      }

      // Fallback to a simpler format if API fails
      console.log('Using fallback coordinates format');
      return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const tryNominatimGeocoding = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&limit=1`;
      console.log('Fetching from URL:', url);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const fetchPromise = fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ShopMind-App/1.0 (React Native)',
          'Accept': 'application/json',
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        return `Error: HTTP ${response.status}`;
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return 'Error: Invalid JSON response';
      }

      console.log('Parsed data:', data);
      
      if (data && data.display_name) {
        console.log('Found address:', data.display_name);
        return data.display_name;
      } else if (data && data.error) {
        console.error('API returned error:', data.error);
        return `Error: ${data.error}`;
      } else {
        console.log('No display_name found');
        return 'Error: No address found';
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('No Location Selected', 'Please select a location on the map');
      return;
    }

    setIsLoading(true);
    try {
      const address = await reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      onLocationSelect({
        address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      
      onClose();
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to get address for selected location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            style={styles.currentLocationButton}
            disabled={isGettingCurrentLocation}
          >
            {isGettingCurrentLocation ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.currentLocationText}>📍</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            provider="google" // Use Google Maps provider for better compatibility
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
                pinColor="#3B82F6"
              />
            )}
          </MapView>
        </View>

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            Tap on the map to select your location
          </Text>
          {selectedLocation && (
            <View>
              <Text style={styles.coordinatesText}>
                📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
              {previewAddress && (
                <Text style={styles.addressPreviewText}>
                  🏠 {previewAddress}
                </Text>
              )}
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmLocation}
            disabled={!selectedLocation || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentLocationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationText: {
    fontSize: 20,
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  instructionText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  coordinatesText: {
    color: '#3B82F6',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  addressPreviewText: {
    color: '#10B981',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  confirmButton: {
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0.1,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LocationPickerModal;
