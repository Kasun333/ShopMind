# API Configuration Guide

This guide explains how to manage API endpoints in the ShopMind application.

## Overview

All API endpoints are now centralized in `src/config/apiConfig.ts`. This allows you to easily change the base IP address when connecting to different networks.

## How to Change IP Address

When you connect to a different network and the IP address changes:

1. Open `src/config/apiConfig.ts`
2. Update the `BASE_IP` value:
   ```typescript
   export const API_CONFIG = {
     BASE_IP: '192.168.1.100', // Change this to your new IP
     // ... rest of config
   };
   ```
3. Save the file - all services will automatically use the new IP

## Available Services

The configuration includes the following services:

- **AUTH_SERVICE** (Port 8080): Authentication and user management
- **ORDER_SERVICE** (Port 8090): Order management  
- **PAYMENT_SERVICE** (Port 8084): Payment processing
- **ECOMMERCE_SERVICE** (Port 8083): Product catalog

## Using API URLs in Your Code

Instead of hardcoding URLs, import and use the predefined constants:

```typescript
import { AUTH_API_URL, ORDER_API_URL, PAYMENT_API_URL, ECOMMERCE_API_URL } from '../config/apiConfig';

// Use in fetch calls
const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
  // ... request options
});
```

## External APIs

External APIs that don't depend on your local network are also defined:

- **EMAIL_VERIFICATION**: Email validation service
- **CLOUDINARY**: Image upload service

## Authentication Service

A new `AuthService` class is available in `src/services/authService.ts` that provides:

- `AuthService.login(credentials)` - User login
- `AuthService.signup(userData)` - User registration  
- `AuthService.validateEmail(email)` - Email validation
- `AuthService.logout()` - User logout
- `AuthService.isAuthenticated()` - Check authentication status
- `AuthService.getCurrentUser()` - Get current user data

### Usage Example:

```typescript
import { AuthService } from '../services/authService';

// Login
const result = await AuthService.login({ username, password });
if (result.success) {
  console.log('Login successful:', result.user);
} else {
  console.error('Login failed:', result.message);
}

// Signup
const signupResult = await AuthService.signup({
  fullName: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  password: 'securepassword',
  phoneNumber: '+1234567890',
  dateOfBirth: '1990-01-01',
  role: 'Customer'
});
```

## Benefits

1. **Single Point of Configuration**: Change IP in one place
2. **Type Safety**: TypeScript interfaces for all API calls
3. **Consistent Error Handling**: Standardized response format
4. **Easy Maintenance**: Centralized API logic
5. **Better Organization**: Separate concerns between UI and API calls

## Migration

All existing screens have been updated to use the centralized configuration:

- ✅ LoginScreen - Uses AuthService
- ✅ SignupScreen - Uses AuthService  
- ✅ EcommerceScreen - Uses ECOMMERCE_API_URL
- ✅ ProductDetailScreen - Uses ECOMMERCE_API_URL
- ✅ OrderService - Uses ORDER_API_URL
- ✅ StripeService - Uses PAYMENT_API_URL

## Adding New Services

To add a new service:

1. Add it to `API_CONFIG` in `apiConfig.ts`:
   ```typescript
   NEW_SERVICE: {
     PORT: '8085',
     BASE_URL: '',
   },
   ```

2. Generate the URL:
   ```typescript
   API_CONFIG.NEW_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.NEW_SERVICE.PORT}`;
   ```

3. Export the URL:
   ```typescript
   export const NEW_API_URL = API_CONFIG.NEW_SERVICE.BASE_URL;
   ```

4. Use it in your code:
   ```typescript
   import { NEW_API_URL } from '../config/apiConfig';
   ```
