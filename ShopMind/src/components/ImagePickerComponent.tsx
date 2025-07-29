import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

interface ImagePickerComponentProps {
  onImageUpload: (imageUrl: string) => void;
  currentImageUrl?: string;
  label?: string;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageUpload,
  currentImageUrl,
  label = 'Profile Image',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelection(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelection(result.assets[0].uri);
    }
  };

  const handleImageSelection = async (imageUri: string) => {
    try {
      setIsUploading(true);
      setSelectedImage(imageUri);

      console.log('Selected image URI:', imageUri);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
      
      // Call the callback with the uploaded URL
      onImageUpload(cloudinaryUrl);
      
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert(
        'Upload Failed', 
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      );
      setSelectedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={selectImage}
        disabled={isUploading}
      >
        {selectedImage ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              {isUploading ? 'Uploading...' : 'Tap to select image'}
            </Text>
            {isUploading && <ActivityIndicator size="small" color="#6B7280" />}
          </View>
        )}
      </TouchableOpacity>

      {selectedImage && !isUploading && (
        <TouchableOpacity style={styles.changeButton} onPress={selectImage}>
          <Text style={styles.changeButtonText}>Change Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ImagePickerComponent;
