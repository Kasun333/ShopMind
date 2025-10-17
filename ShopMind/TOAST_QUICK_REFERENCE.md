# 🎨 Toast Service - Quick Reference

## Import
```typescript
import ToastService from '../services/toastService';
```

## Usage Examples

### 🛒 Cart Addition
```typescript
ToastService.cart(
  '🛒 Added to Cart!',
  `${product.name} has been added to your cart`
);
```

### 💳 Payment Success
```typescript
ToastService.payment(
  '🎉 Payment Successful!',
  `Order #${orderId} placed successfully!`
);
```

### ✅ Success
```typescript
ToastService.success(
  'Success!',
  'Operation completed successfully'
);
```

### ❌ Error
```typescript
ToastService.error(
  'Error',
  'Something went wrong. Please try again.'
);
```

### ⚠️ Warning
```typescript
ToastService.warning(
  'Warning',
  'Please check your input'
);
```

### ℹ️ Info
```typescript
ToastService.info(
  'Info',
  'Here is some information'
);
```

## Custom Duration
```typescript
ToastService.cart('Title', 'Message', 5000); // 5 seconds
```

## Features
- ✨ Slides in from right
- 🎨 Modern gradient design
- ⏱️ Progress bar animation
- 👆 Tap to dismiss
- 🔄 Auto-dismiss
- 📚 Stacks multiple toasts

## Color Themes
- **Cart**: Primary Blue to Purple (`#007AFF` → `#5856D6`)
- **Payment**: Primary Blue to Purple (`#007AFF` → `#5856D6`)
- **Success**: Green (`#10B981` → `#059669`)
- **Error**: Red (`#EF4444` → `#DC2626`)
- **Warning**: Orange (`#F59E0B` → `#D97706`)
- **Info**: Blue (`#3B82F6` → `#2563EB`)
