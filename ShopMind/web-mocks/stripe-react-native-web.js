// Web-compatible mock for @stripe/stripe-react-native
import React from 'react';

// Mock Stripe Provider
export const StripeProvider = ({ children, publishableKey }) => {
  console.warn('StripeProvider: Using web fallback - Stripe functionality will be limited on web');
  return React.createElement(React.Fragment, null, children);
};

// Mock initStripe function
export const initStripe = async (options) => {
  console.warn('initStripe: Using web fallback - Stripe initialization skipped on web');
  return Promise.resolve();
};

// Mock useStripe hook
export const useStripe = () => {
  console.warn('useStripe: Using web fallback - Stripe functionality will be limited on web');
  
  return {
    confirmPayment: async () => {
      console.warn('confirmPayment: Not available on web - use Stripe.js instead');
      return { error: { message: 'Payment not available on web platform' } };
    },
    createPaymentMethod: async () => {
      console.warn('createPaymentMethod: Not available on web - use Stripe.js instead');
      return { error: { message: 'Payment method creation not available on web platform' } };
    },
    retrievePaymentIntent: async () => {
      console.warn('retrievePaymentIntent: Not available on web - use Stripe.js instead');
      return { error: { message: 'Payment intent retrieval not available on web platform' } };
    },
  };
};

// Mock CardField component
export const CardField = ({ onCardChange, ...props }) => {
  console.warn('CardField: Using web fallback - Stripe card input not available on web');
  
  return React.createElement('div', {
    style: {
      border: '1px solid #ccc',
      padding: '12px',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9',
      color: '#666',
      textAlign: 'center',
      marginVertical: 10,
    },
    ...props
  }, 'Card input not available on web platform. Please use a mobile device for payment functionality.');
};

// Mock useConfirmPayment hook
export const useConfirmPayment = () => {
  console.warn('useConfirmPayment: Using web fallback - Payment confirmation not available on web');
  
  return {
    confirmPayment: async () => {
      console.warn('confirmPayment: Not available on web - use Stripe.js instead');
      return { error: { message: 'Payment confirmation not available on web platform' } };
    }
  };
};

// Export other common Stripe components as mocks
export const ApplePayButton = (props) => {
  console.warn('ApplePayButton: Not available on web platform');
  return null;
};

export const GooglePayButton = (props) => {
  console.warn('GooglePayButton: Not available on web platform');
  return null;
};

// Mock Stripe Elements
export const Elements = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

// Default export
const StripeReactNative = {
  StripeProvider,
  initStripe,
  useStripe,
  CardField,
  useConfirmPayment,
  ApplePayButton,
  GooglePayButton,
  Elements,
};

export default StripeReactNative;