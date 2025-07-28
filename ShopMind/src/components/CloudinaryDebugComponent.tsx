import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testCloudinaryConfig } from '../services/cloudinaryService';

const CloudinaryDebugComponent: React.FC = () => {
  const testConfig = () => {
    try {
      const config = testCloudinaryConfig();
      Alert.alert(
        'Cloudinary Config', 
        `Cloud Name: ${config.cloudName}\nUpload Preset: ${config.uploadPreset}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Config Error', 
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={testConfig}>
        <Text style={styles.buttonText}>Test Cloudinary Config</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CloudinaryDebugComponent;
