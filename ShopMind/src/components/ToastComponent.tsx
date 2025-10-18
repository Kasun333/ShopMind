import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ToastService, { ToastNotification } from '../services/toastService';

const { width } = Dimensions.get('window');

interface ToastComponentProps {
  // You can add props if needed
}

interface AnimatedToast extends ToastNotification {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  progressAnim: Animated.Value;
}

const ToastComponent: React.FC<ToastComponentProps> = () => {
  const [toasts, setToasts] = useState<AnimatedToast[]>([]);

  useEffect(() => {
    // Subscribe to toast notifications
    const unsubscribe = ToastService.subscribe((toast) => {
      const newToast = {
        ...toast,
        fadeAnim: new Animated.Value(0),
        slideAnim: new Animated.Value(width), // Start from right side
        scaleAnim: new Animated.Value(0.8),
        progressAnim: new Animated.Value(0),
      };
      
      setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts
      
      // Animate in with slide from right, scale, and fade
      Animated.parallel([
        Animated.timing(newToast.fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(newToast.slideAnim, {
          toValue: 0,
          tension: 45,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(newToast.scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();

      // Progress bar animation
      Animated.timing(newToast.progressAnim, {
        toValue: 1,
        duration: toast.duration || 4000,
        useNativeDriver: false,
      }).start();

      // Auto hide after duration
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(newToast.fadeAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(newToast.slideAnim, {
            toValue: width, // Slide out to right
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(newToast.scaleAnim, {
            toValue: 0.8,
            duration: 350,
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
        return ['#10B981', '#059669']; // Modern Green
      case 'error':
        return ['#EF4444', '#DC2626']; // Modern Red
      case 'warning':
        return ['#F59E0B', '#D97706']; // Modern Orange
      case 'info':
        return ['#3B82F6', '#2563EB']; // Modern Blue
      case 'cart':
        return ['#007AFF', '#5856D6']; // Primary Blue to Purple gradient for cart
      case 'payment':
        return ['#007AFF', '#5856D6']; // Primary Blue to Purple gradient for payment
      default:
        return ['#007AFF', '#5856D6']; // Primary gradient as default
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { library: 'Ionicons', name: 'checkmark-circle' };
      case 'error':
        return { library: 'Ionicons', name: 'close-circle' };
      case 'warning':
        return { library: 'Ionicons', name: 'warning' };
      case 'info':
        return { library: 'Ionicons', name: 'information-circle' };
      case 'cart':
        return { library: 'Ionicons', name: 'cart' };
      case 'payment':
        return { library: 'Ionicons', name: 'card' };
      default:
        return { library: 'Ionicons', name: 'information-circle' };
    }
  };

  const removeToast = (toastId: string) => {
    const toast = toasts.find(t => t.id === toastId);
    if (toast && toast.fadeAnim && toast.slideAnim && toast.scaleAnim) {
      Animated.parallel([
        Animated.timing(toast.fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toast.slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toast.scaleAnim, {
          toValue: 0.8,
          duration: 300,
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
      {toasts.map((toast, index) => {
        const icon = getToastIcon(toast.type);
        const progressWidth = toast.progressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
        });

        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toastWrapper,
              {
                opacity: toast.fadeAnim,
                transform: [
                  { translateX: toast.slideAnim },
                  { scale: toast.scaleAnim },
                  { translateY: index * 95 }
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
                {/* Glassy overlay effect */}
                <View style={styles.glassOverlay} />
                
                <View style={styles.toastContent}>
                  {/* Icon with animated background */}
                  <View style={styles.iconContainer}>
                    <View style={styles.iconPulse} />
                    {icon.library === 'Ionicons' ? (
                      <Ionicons name={icon.name as any} size={26} color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons name={icon.name as any} size={26} color="#FFFFFF" />
                    )}
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
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Progress bar at bottom */}
                <View style={styles.progressBarContainer}>
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      { width: progressWidth }
                    ]} 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    left: 16,
    zIndex: 99999,
    alignItems: 'flex-end',
  },
  toastWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    maxWidth: 360,
    minWidth: 320,
  },
  toast: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: '#FFFFFF',
  },
  toastGradient: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    position: 'relative',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastText: {
    flex: 1,
    marginRight: 10,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.98,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 12,
    marginHorizontal: -18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 20,
  },
});

export default ToastComponent;
