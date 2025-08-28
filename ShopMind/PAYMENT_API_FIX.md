# Backend API Structure Fix - Payment Intent

## Problem Identified

The backend Java server expects a different structure for the payment intent request than what the frontend was sending.

## Backend Expected Structure

Based on the error trace, the backend expects:

```java
// Backend Java class structure
public class CreatePaymentIntentRequest {
    // Standard fields
    private int amount;
    private String currency;
    private int customerId;
    
    // Backend expects this method
    public List<OrderItem> getOrderItems() { ... }
}

public class OrderItem {
    // Backend expects these methods
    public int getProductId() { ... }
    public String getBarcode() { ... }
    public int getQuantity() { ... }
    public double getUnitPrice() { ... }
}
```

## Frontend Structure (Fixed)

Updated the frontend interfaces to match:

```typescript
export interface CreatePaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  customerId: number;
  orderItems: Array<{
    productId: number;
    barcode?: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```

## Changes Made

1. **stripeService.ts**: 
   - Changed `items` to `orderItems`
   - Changed `price` to `unitPrice`
   - Added `barcode` field (using productId as fallback)

2. **CheckoutScreen.tsx**:
   - Updated payment request mapping to use correct field names
   - Added barcode field using productId as value

## Key Differences

| Frontend (Old) | Backend Expected | Frontend (Fixed) |
|---------------|------------------|------------------|
| `items` | `orderItems` | `orderItems` |
| `price` | `unitPrice` | `unitPrice` |
| N/A | `barcode` | `barcode` (using productId) |

## Testing

After this fix, the payment intent creation should work properly with the backend Java service.

The request will now be structured correctly for the backend to process without compilation errors.
