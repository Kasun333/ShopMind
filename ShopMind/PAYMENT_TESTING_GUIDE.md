# 🧪 Complete Stripe Payment Testing Guide

## Issue Fixed ✅
**Problem**: Backend was receiving `null` for `customerId` because of field name mismatch.
**Solution**: Updated frontend to use camelCase field names to match Spring Boot DTO conventions:
- `customer_id` → `customerId`
- `product_id` → `productId`
- `order_id` → `orderId`
- `payment_intent_id` → `paymentIntentId`
- `payment_method_id` → `paymentMethodId`

## 🚀 Testing Steps

### Step 1: Verify Backend is Running
Make sure your Spring Boot application is running on port 8084 (as configured in stripeService.ts).

### Step 2: Test the Complete Flow

#### A. Add Items to Cart
1. Open your React Native app
2. Navigate to any product detail screen
3. Add some items to cart
4. Verify the cart badge updates

#### B. Navigate to Checkout
1. Go to Cart tab
2. Verify cart items are displayed
3. Click "Proceed to Checkout" button
4. Should navigate to checkout screen

#### C. Test Payment Intent Creation
In checkout screen, you should see:
- Order summary with all cart items
- Payment breakdown (subtotal, shipping, tax, total)
- Customer information
- Stripe card input field

#### D. Test Stripe Payment
1. Fill in test card details:
   - **Card Number**: `4242 4242 4242 4242` (Visa)
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

2. Click "Pay $X.XX" button
3. Watch for the payment flow

### Step 3: Monitor Logs

#### Frontend Logs (React Native Debugger/Console):
Look for these logs:
```
Creating payment intent: {amount: 2999, currency: "usd", customerId: 1, items: [...]}
Payment intent created: {success: true, payment_intent: {...}, order_id: 1}
Payment succeeded: {id: "pi_...", status: "Succeeded"}
Confirming payment: {orderId: 1, paymentIntentId: "pi_...", paymentMethodId: "pm_..."}
Payment confirmed: {success: true, message: "Payment confirmed successfully"}
```

#### Backend Logs (Spring Boot Console):
Check for:
- Payment intent creation requests
- Stripe API calls
- Database insertions for orders, order_items, invoices, payments
- No null pointer exceptions

### Step 4: Verify Database Updates

After successful payment, check your database:

```sql
-- Check orders table
SELECT * FROM orders ORDER BY order_id DESC LIMIT 5;

-- Check order_items table  
SELECT * FROM order_items ORDER BY order_item_id DESC LIMIT 10;

-- Check payments table
SELECT * FROM payments ORDER BY payment_id DESC LIMIT 5;

-- Check invoices table
SELECT * FROM invoices ORDER BY invoice_id DESC LIMIT 5;
```

Expected data:
- **orders**: New order with status 'CONFIRMED'
- **order_items**: Items from your cart
- **payments**: Payment with stripe_payment_intent_id and status 'PAID'
- **invoices**: Invoice with payment_status 'PAID'

## 🔧 Testing Different Scenarios

### Test Case 1: Successful Payment
- Use card: `4242 4242 4242 4242`
- Expected: Payment succeeds, cart clears, success message

### Test Case 2: Declined Payment
- Use card: `4000 0000 0000 0002`
- Expected: Payment fails, error message shown, cart remains

### Test Case 3: Authentication Required
- Use card: `4000 0025 0000 3155`
- Expected: Additional authentication step

### Test Case 4: Empty Cart
- Clear cart and try to access checkout
- Expected: Shows "cart is empty" message

### Test Case 5: Network Issues
- Stop backend server and try payment
- Expected: Graceful error handling

## 🐛 Common Issues & Solutions

### Issue 1: "customerId is null"
**Solution**: ✅ Already fixed - frontend now sends correct field names

### Issue 2: "Cannot connect to server"
**Check**: 
- Backend is running on correct port (8084)
- IP address in stripeService.ts matches your backend
- Firewall/network settings

### Issue 3: "Stripe initialization failed"
**Check**:
- Stripe publishable key is correct
- Expo app has internet connection

### Issue 4: "Order not found" in confirmation
**Check**:
- Database connection
- Order creation in payment intent step
- Transaction rollback issues

## 📱 Expected User Experience

1. **Browse & Add**: User adds items to cart
2. **Review Cart**: User sees cart summary with totals
3. **Checkout**: User clicks "Proceed to Checkout"
4. **Payment Info**: User enters card details
5. **Processing**: Shows loading state while processing
6. **Success**: Payment succeeds, cart clears, success message
7. **Database**: All tables updated with order information

## 🔍 Debug Commands

### Test Backend Directly (Optional):
```bash
# Test payment intent creation
curl -X POST http://192.168.1.5:8084/api/payments/create-intent \
-H "Content-Type: application/json" \
-d '{
  "amount": 2999,
  "currency": "usd", 
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 14.99
    }
  ]
}'
```

## ✅ Success Criteria

Payment integration is working correctly when:
- ✅ Cart items display correctly
- ✅ Checkout screen shows proper totals
- ✅ Stripe card field accepts input
- ✅ Payment intent creates successfully
- ✅ Stripe payment processes without errors
- ✅ Backend confirms payment
- ✅ Database tables update correctly
- ✅ Cart clears after successful payment
- ✅ User sees success message

Now test the payment flow and let me know if you encounter any issues!
