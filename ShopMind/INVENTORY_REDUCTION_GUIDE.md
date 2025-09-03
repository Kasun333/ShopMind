# Inventory Reduction Integration

This document explains the inventory reduction functionality that was added to the StoreKeeper's Process Order screen.

## Overview

After successful barcode scanning, the system now automatically reduces the product inventory by calling the inventory API. This ensures that stock levels are updated in real-time as orders are processed.

## API Integration

### Endpoint
```
POST http://localhost:8083/api/products/{productId}/reduce/{quantity}
```

### Configuration
The endpoint uses the centralized API configuration:
- **Service**: ECOMMERCE_SERVICE 
- **URL**: Configured in `src/config/apiConfig.ts`
- **Current**: `http://192.168.1.11:8083`

## Implementation Details

### Files Modified

1. **Created**: `src/services/inventoryService.ts`
   - `InventoryService.reduceInventory()` - Single product reduction
   - `InventoryService.batchReduceInventory()` - Multiple products reduction

2. **Updated**: `src/screens/storekeeper/ProcessOrderScreen.tsx`
   - Added inventory service import
   - Modified `handleBarcodeScanned()` to call inventory API
   - Added proper error handling and user feedback

### Workflow

1. **StoreKeeper scans barcode** → Barcode validation occurs
2. **If barcode matches** → Item marked as scanned
3. **Inventory API called** → `POST /api/products/{productId}/reduce/{quantity}`
4. **Success response** → Inventory reduced, process continues
5. **Error response** → Warning shown, but order processing continues

### Error Handling

The system handles various error scenarios gracefully:

- **API unavailable**: Shows warning, allows order to continue
- **Product ID missing**: Logs warning, skips inventory reduction
- **Inventory reduction fails**: Shows alert but doesn't block order processing
- **Network issues**: Provides user feedback, logs error details

### Features

✅ **Real-time inventory reduction** after barcode scanning  
✅ **Automatic retry logic** with proper error handling  
✅ **User feedback** for success and error states  
✅ **Batch processing** support for multiple items  
✅ **Null safety** for items without product IDs  
✅ **Detailed logging** for debugging  

## Usage Example

```typescript
// Single product reduction
const result = await InventoryService.reduceInventory(productId, quantity, token);
if (result.success) {
  console.log('Inventory reduced successfully');
} else {
  console.error('Failed to reduce inventory:', result.message);
}

// Batch reduction
const items = [
  { productId: 1, quantity: 2 },
  { productId: 2, quantity: 1 }
];
const batchResult = await InventoryService.batchReduceInventory(items, token);
```

## Configuration

To change the inventory service endpoint:

1. Update `src/config/apiConfig.ts`:
```typescript
ECOMMERCE_SERVICE: {
  PORT: '8083', // Change port if needed
  BASE_URL: '',
},
```

2. Update the base IP if on different network:
```typescript
BASE_IP: '192.168.1.11', // Change to your network IP
```

## Backend Requirements

The backend inventory API should:

1. **Accept POST requests** to `/api/products/{productId}/reduce/{quantity}`
2. **Require authentication** via Bearer token
3. **Return JSON response** with success/error status
4. **Handle concurrent requests** safely
5. **Validate sufficient stock** before reduction

### Expected Response Format

```json
{
  "success": true,
  "message": "Inventory reduced successfully",
  "remainingStock": 25
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Insufficient stock available"
}
```

## Benefits

1. **Real-time Accuracy**: Inventory updated immediately upon scanning
2. **Error Prevention**: Validates stock before processing
3. **Audit Trail**: Logs all inventory changes with timestamps
4. **User Experience**: Seamless integration with existing workflow
5. **Reliability**: Graceful error handling ensures order processing continues

## Testing

To test the inventory reduction:

1. **Start the backend services** (port 8083 for products/inventory)
2. **Login as StoreKeeper** in the mobile app
3. **Navigate to Process Orders** screen
4. **Select an order** with confirmed status
5. **Scan barcodes** for order items
6. **Check console logs** for inventory API calls
7. **Verify backend database** for updated stock levels

## Troubleshooting

### Common Issues

1. **405 Method Not Allowed**: Backend endpoint not implemented or wrong HTTP method
2. **Network timeout**: Check if backend service is running on port 8083
3. **Authentication errors**: Verify token is being passed correctly
4. **Product ID null**: Some order items may not have valid product IDs

### Debug Information

Enable detailed logging by checking console output for:
- `InventoryService.reduceInventory` - Shows API calls and responses
- `Reducing inventory for product` - Shows which products are being processed
- API response status codes and error messages

## Future Enhancements

Potential improvements for the inventory system:

1. **Offline support**: Queue inventory reductions when offline
2. **Bulk operations**: Reduce all order items in single API call
3. **Stock validation**: Check available stock before allowing scan
4. **Real-time updates**: WebSocket notifications for stock changes
5. **Rollback mechanism**: Reverse inventory changes if order cancelled
