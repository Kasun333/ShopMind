import { initStripe } from '@stripe/stripe-react-native';

// Your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RruEkCMSVvAbN0Rb1KpfTDO1yPhc7R3BNFALqZTR1G2bggo2w1rSEx78EKBkt8VwRgls5isLAO0OyHyz88FrEtf00JDvUIAap';

export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.shopmind', // Replace with your merchant identifier
    });
    console.log('Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return false;
  }
};

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  customer_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
  }>;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  payment_intent?: PaymentIntent;
  order_id?: number;
  message?: string;
  error?: string;
}

export class StripeService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://192.168.1.5:8083') {
    this.baseUrl = baseUrl;
  }

  // Create payment intent on your backend
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    try {
      console.log('Creating payment intent:', request);
      
      const response = await fetch(`${this.baseUrl}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment intent creation failed:', response.status, errorText);
        return {
          success: false,
          error: `Failed to create payment intent: ${response.status}`,
        };
      }

      const data = await response.json();
      console.log('Payment intent created:', data);
      
      return {
        success: true,
        payment_intent: data.payment_intent,
        order_id: data.order_id,
        message: data.message,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Confirm payment after successful Stripe payment
  async confirmPayment(
    orderId: number,
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Confirming payment:', { orderId, paymentIntentId, paymentMethodId });
      
      const response = await fetch(`${this.baseUrl}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment confirmation failed:', response.status, errorText);
        return {
          success: false,
          error: `Failed to confirm payment: ${response.status}`,
        };
      }

      const data = await response.json();
      console.log('Payment confirmed:', data);
      
      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
