import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ToastService, { ToastNotification } from '../services/toastService';

const { width } = Dimensions.get('window');

interface ToastComponentProps {
  // You can add props if needed
}

const ToastComponent: React.FC<ToastComponentProps> = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Subscribe to toast notifications
    const unsubscribe = ToastService.subscribe((toast) => {
      setToasts(prev => [toast, ...prev.slice(0, 2)]); // Keep max 3 toasts
      
      // Animate in
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(toast.duration || 4000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Remove toast after animation
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      });
    });

    return unsubscribe;
  }, []);

  const getToastColors = (type: string): [string, string] => {
    switch (type) {
      case 'success':
        return ['#10B981', '#059669'];
      case 'error':
        return ['#EF4444', '#DC2626'];
      case 'warning':
        return ['#F59E0B', '#D97706'];
      case 'info':
      default:
        return ['#2A7CC7', '#1E6091'];
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'info':
      default:
        return 'information-circle-outline';
    }
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toastWrapper,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0]
                })
              }],
              top: 60 + (index * 80), // Stack toasts
              zIndex: 1000 - index,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => removeToast(toast.id)}
            activeOpacity={0.9}
            style={styles.toast}
          >
            <LinearGradient
              colors={getToastColors(toast.type)}
              style={styles.toastGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.toastContent}>
                <Ionicons 
                  name={getToastIcon(toast.type) as any} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <View style={styles.toastText}>
                  <Text style={styles.toastTitle} numberOfLines={1}>
                    {toast.title}
                  </Text>
                  <Text style={styles.toastMessage} numberOfLines={2}>
                    {toast.message}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeToast(toast.id)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  toast: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default ToastComponent;
