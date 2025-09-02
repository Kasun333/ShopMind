# User Orders Feature Documentation

This documentation covers the new User Orders functionality integrated into the MessagesScreen.

## Overview

The MessagesScreen now includes a tab-based interface with:
- **Messages Tab**: Original messaging functionality
- **My Orders Tab**: Complete order management with filtering capabilities

## Components Created

### 1. UserOrderService (`src/services/userOrderService.ts`)

A comprehensive service for managing user orders:

```typescript
import { UserOrderService } from '../services/userOrderService';

// Fetch user orders
const result = await UserOrderService.getUserOrders(userId, token);

// Filter orders by status
const deliveredOrders = UserOrderService.filterOrdersByStatus(orders, 'DELIVERED');

// Get available statuses
const statuses = UserOrderService.getUniqueStatuses(orders);

// Format date
const formattedDate = UserOrderService.formatOrderDate(orderDate);

// Get status colors
const color = UserOrderService.getStatusColor('DELIVERED');
const bgColor = UserOrderService.getStatusBackgroundColor('DELIVERED');
```

#### Key Features:
- ✅ Fetch orders from API using centralized config
- ✅ Filter orders by status (ALL, PENDING, CONFIRMED, PROCESSED, DELIVERED, etc.)
- ✅ Get unique order statuses dynamically
- ✅ Format dates for display
- ✅ Provide status-based colors for UI

### 2. UserOrdersComponent (`src/components/UserOrdersComponent.tsx`)

A complete React Native component for displaying and filtering user orders:

#### Features:
- ✅ **Status Filtering**: Horizontal scrollable filter tabs
- ✅ **Order Display**: Cards showing order details, items, and total
- ✅ **Pull to Refresh**: Swipe down to refresh orders
- ✅ **Loading States**: Loading spinners and error handling
- ✅ **Empty States**: User-friendly messages when no orders found
- ✅ **Image Support**: Product images with fallback placeholders
- ✅ **Responsive Design**: Adapts to different screen sizes

#### Visual Elements:
- Order cards with status badges
- Product image previews
- Item counts and totals
- Date formatting
- Color-coded status indicators

### 3. Updated MessagesScreen (`src/screens/MessagesScreen.tsx`)

Enhanced with tab navigation:

#### New Features:
- ✅ **Tab Interface**: Switch between Messages and Orders
- ✅ **Gradient Header**: Updated to show both sections
- ✅ **State Management**: Maintains tab selection
- ✅ **User Integration**: Passes user ID and token to orders component

## API Integration

### Endpoint Used
```
GET http://192.168.1.11:8084/api/orders/user/{userId}
```

### Response Format
```json
{
  "success": true,
  "message": "Orders for customer retrieved successfully",
  "orders": [
    {
      "orderId": 14,
      "customerId": 1,
      "orderDate": "2025-09-02T10:00:48",
      "status": "CONFIRMED",
      "totalAmount": 103.16,
      "createdAt": "2025-09-02T10:00:48.209028",
      "updatedAt": "2025-09-02T10:00:55.024058",
      "orderItems": [
        {
          "orderItemId": 17,
          "productId": 3,
          "productName": "DSLR Camera",
          "productImageUrl": "https://res.cloudinary.com/...",
          "quantity": 1,
          "barcode": "PRD-20250812015746-hasitha",
          "price": 29.99,
          "createdAt": "2025-09-02T10:00:48.516567"
        }
      ]
    }
  ],
  "totalOrders": 12
}
```

## Status Filter Options

The system automatically detects available statuses from the orders and provides filtering options:

- **ALL**: Shows all orders
- **PENDING**: Orders awaiting confirmation
- **CONFIRMED**: Orders confirmed by store
- **PROCESSED**: Orders being prepared
- **DELIVERED**: Completed orders
- **Any other status**: Dynamically added

## Status Color Coding

Each status has associated colors for better UX:

| Status | Text Color | Background Color |
|--------|------------|------------------|
| PENDING | #F59E0B | #FEF3C7 |
| CONFIRMED | #3B82F6 | #DBEAFE |
| PROCESSED | #8B5CF6 | #EDE9FE |
| DELIVERED | #10B981 | #D1FAE5 |
| CANCELLED | #EF4444 | #FEE2E2 |
| Default | #6B7280 | #F3F4F6 |

## Usage

### In MessagesScreen
The orders functionality is automatically available in the MessagesScreen:

```typescript
// MessagesScreen props
interface MessagesScreenProps {
  user: {
    id: string; // Converted to number for API
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

// The component automatically:
// 1. Converts user.id to number for API calls
// 2. Passes token for authentication
// 3. Handles tab switching
// 4. Manages state between Messages and Orders
```

### Standalone Usage
You can also use UserOrdersComponent independently:

```typescript
import UserOrdersComponent from '../components/UserOrdersComponent';

<UserOrdersComponent 
  userId={1} 
  token="your-auth-token" 
/>
```

## Configuration

### API Configuration
The orders service uses the centralized API configuration:

```typescript
// In src/config/apiConfig.ts
ORDER_SERVICE: {
  PORT: '8084',
  BASE_URL: 'http://192.168.1.11:8084',
}
```

To change the IP address:
1. Update `BASE_IP` in `apiConfig.ts`
2. All order API calls will automatically use the new IP

### Customization
You can customize the component by modifying:

- **Colors**: Update status colors in `UserOrderService`
- **Layout**: Modify styles in `UserOrdersComponent`
- **Filters**: Add/remove status filters
- **Display Fields**: Show/hide order information

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: "Could not connect to server"
- **API Errors**: Shows server-provided error messages
- **Loading States**: Spinner during data fetch
- **Empty States**: User-friendly messages when no data
- **Retry Functionality**: Users can retry failed requests

## Performance Features

- **Lazy Loading**: Only loads when Orders tab is selected
- **Pull to Refresh**: Easy data refresh
- **Efficient Filtering**: Client-side filtering for fast response
- **Image Optimization**: Proper image loading with fallbacks

## Testing

### Test Credentials
- Username: `Wasantha@123`
- Password: `Wasantha@123`
- User ID: `1`

### Expected Behavior
1. Login successfully shows MessagesScreen
2. Click "My Orders" tab
3. See list of orders with status filters
4. Filter by different statuses
5. Pull down to refresh
6. View order details and items

## Benefits

1. **Centralized Order Management**: Users can view all orders in one place
2. **Status Filtering**: Easy filtering by order status
3. **Real-time Updates**: Pull-to-refresh functionality
4. **Visual Appeal**: Status-coded colors and clean design
5. **Responsive Design**: Works on different screen sizes
6. **Error Resilience**: Comprehensive error handling
7. **Performance**: Efficient loading and filtering

## Future Enhancements

Potential improvements:
- Order detail drill-down screens
- Order tracking functionality
- Reorder capabilities
- Order cancellation
- Real-time status updates
- Push notifications for status changes
