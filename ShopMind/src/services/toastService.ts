import { Alert } from 'react-native';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'cart' | 'payment';
  timestamp: Date;
  duration?: number;
}

type ToastListener = (toast: ToastNotification) => void;

class ToastService {
  private static listeners: ToastListener[] = [];
  private static toastCounter = 0;

  // Subscribe to toast notifications
  static subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Show a toast notification
  static show(
    title: string, 
    message: string, 
    type: 'success' | 'info' | 'warning' | 'error' | 'cart' | 'payment' = 'info',
    duration: number = 4000
  ): string {
    const toast: ToastNotification = {
      id: `toast_${++this.toastCounter}_${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date(),
      duration,
    };

    console.log('🍞 Showing toast:', toast);

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(toast);
      } catch (error) {
        console.error('❌ Error in toast listener:', error);
      }
    });

    return toast.id;
  }

  // Show success toast
  static success(title: string, message: string, duration?: number): string {
    return this.show(title, message, 'success', duration);
  }

  // Show info toast
  static info(title: string, message: string, duration?: number): string {
    return this.show(title, message, 'info', duration);
  }

  // Show warning toast
  static warning(title: string, message: string, duration?: number): string {
    return this.show(title, message, 'warning', duration);
  }

  // Show error toast
  static error(title: string, message: string, duration?: number): string {
    return this.show(title, message, 'error', duration);
  }

  // Show cart toast (for adding items to cart)
  static cart(title: string, message: string, duration: number = 3000): string {
    return this.show(title, message, 'cart', duration);
  }

  // Show payment toast (for successful payments)
  static payment(title: string, message: string, duration: number = 5000): string {
    return this.show(title, message, 'payment', duration);
  }

  // Show notification toast (for incoming notifications)
  static notification(title: string, message: string, data?: any): string {
    return this.show(title, message, 'info', 5000);
  }

  // Fallback to Alert if no toast component is listening
  static showAlert(title: string, message: string) {
    Alert.alert(title, message);
  }
}

export default ToastService;
