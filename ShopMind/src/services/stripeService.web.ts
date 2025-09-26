import { loadStripe } from '@stripe/stripe-js';

// Your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RruEkCMSVvAbN0Rb1KpfTDO1yPhc7R3BNFALqZTR1G2bggo2w1rSEx78EKBkt8VwRgls5isLAO0OyHyz88FrEtf00JDvUIAap';

let stripePromise: Promise<any> | null = null;

export const initializeStripe = async () => {
  try {
    if (!stripePromise) {
      stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    await stripePromise;
    console.log('Stripe initialized successfully for web');
    return true;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return false;
  }
};

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

import { PAYMENT_API_URL } from '../config/apiConfig';

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: { [key: string]: string };
}

export interface PaymentIntentResponse {
  success: boolean;
  message: string;
  paymentIntent?: PaymentIntent;
  error?: string;
}

export class StripeService {
  private static instance: StripeService;
  private initialized: boolean = false;

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      this.initialized = await initializeStripe();
      return this.initialized;
    } catch (error) {
      console.error('Error initializing Stripe service:', error);
      return false;
    }
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        message: 'Failed to create payment intent',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${PAYMENT_API_URL}/api/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        message: 'Failed to confirm payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Web-specific payment confirmation using Stripe.js
  async confirmCardPayment(clientSecret: string, cardElement: any): Promise<any> {
    try {
      if (!stripePromise) {
        throw new Error('Stripe not initialized');
      }
      
      const stripe = await stripePromise;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      return result;
    } catch (error) {
      console.error('Error confirming card payment:', error);
      throw error;
    }
  }

  async getStripeInstance() {
    if (!stripePromise) {
      await this.initialize();
    }
    return stripePromise;
  }
}

export default StripeService.getInstance();