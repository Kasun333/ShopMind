import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ToastService, { ToastNotification } from '../services/toastService';

const { width } = Dimensions.get('window');

interface ToastComponentProps {
  // You can add props if needed
}

interface AnimatedToast extends ToastNotification {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const ToastComponent: React.FC<ToastComponentProps> = () => {
  const [toasts, setToasts] = useState<AnimatedToast[]>([]);

  useEffect(() => {
    // Subscribe to toast notifications
    const unsubscribe = ToastService.subscribe((toast) => {
      const newToast = {
        ...toast,
        fadeAnim: new Animated.Value(0),
        slideAnim: new Animated.Value(50),
      };
      
      setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts
      
      // Animate in with slide and fade
      Animated.parallel([
        Animated.timing(newToast.fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(newToast.slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();

      // Auto hide after duration
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(newToast.fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(newToast.slideAnim, {
            toValue: 50,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        });
      }, toast.duration || 4000);
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
        return ['#2A7CC7', '#245e91ff'];
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
      default:
        return 'information';
    }
  };

  const removeToast = (toastId: string) => {
    const toast = toasts.find(t => t.id === toastId);
    if (toast && toast.fadeAnim && toast.slideAnim) {
      Animated.parallel([
        Animated.timing(toast.fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toast.slideAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      });
    }
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
              opacity: toast.fadeAnim,
              transform: [
                {
                  translateX: toast.slideAnim
                },
                {
                  translateY: index * 90 // Stack toasts vertically
                }
              ],
              zIndex: 10000 - index,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => removeToast(toast.id)}
            activeOpacity={0.95}
            style={styles.toast}
          >
            <LinearGradient
              colors={getToastColors(toast.type)}
              style={styles.toastGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.toastContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={getToastIcon(toast.type) as any} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.toastText}>
                  {toast.title && (
                    <Text style={styles.toastTitle} numberOfLines={1}>
                      {toast.title}
                    </Text>
                  )}
                  <Text style={styles.toastMessage} numberOfLines={2}>
                    {toast.message}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeToast(toast.id)}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
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
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    zIndex: 99999,
    maxWidth: 380,
  },
  toastWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    minWidth: 320,
  },
  toast: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },
  toastGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastText: {
    flex: 1,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 18,
    fontWeight: '400',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ToastComponent;
