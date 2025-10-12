/**
 * Navigation Test Utilities
 * Reusable mocks and utilities for testing navigation between screens
 */

import { User } from '../../types/User';

// Mock User Factory
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'User',
  accountStatus: 'active',
  createdAt: '2024-01-01',
  dateOfBirth: '1990-01-01',
  formattedAddress: '123 Test St',
  latitude: 0,
  longitude: 0,
  phoneNumber: '1234567890',
  profileImageUrl: 'https://example.com/avatar.jpg',
  ...overrides,
});

// Mock Users for Different Roles
export const mockUsers = {
  customer: createMockUser({ role: 'User', username: 'customer' }),
  driver: createMockUser({ 
    role: 'Driver', 
    username: 'driver',
    fullName: 'Driver User',
    email: 'driver@example.com'
  }),
  storeKeeper: createMockUser({ 
    role: 'Store Keeper', 
    username: 'storekeeper',
    fullName: 'Store Keeper',
    email: 'keeper@example.com'
  }),
};

// Navigation Mock Functions
export const createNavigationMocks = () => ({
  onLogin: jest.fn(),
  onLogout: jest.fn(),
  onShowSignup: jest.fn(),
  onNavigateToCheckout: jest.fn(),
  onBack: jest.fn(),
  onPaymentSuccess: jest.fn(),
  onTabPress: jest.fn(),
});

// Mock Navigation Props
export interface MockNavigationProps {
  user: User;
  token: string;
  onLogin?: jest.Mock;
  onLogout?: jest.Mock;
  onShowSignup?: jest.Mock;
}

export const createMockNavigationProps = (
  userType: keyof typeof mockUsers = 'customer',
  overrides: Partial<MockNavigationProps> = {}
): MockNavigationProps => {
  const mocks = createNavigationMocks();
  return {
    user: mockUsers[userType],
    token: `${userType}-token`,
    onLogin: mocks.onLogin,
    onLogout: mocks.onLogout,
    onShowSignup: mocks.onShowSignup,
    ...overrides,
  };
};

// Navigation Test Helpers
export const navigationTestHelpers = {
  // Simulate successful login flow
  simulateSuccessfulLogin: (mockAuthService: any, userType: keyof typeof mockUsers = 'customer') => {
    const user = mockUsers[userType];
    mockAuthService.login.mockResolvedValue({
      success: true,
      message: 'Login successful',
      user,
      token: `${userType}-token`,
    });
    return { user, token: `${userType}-token` };
  },

  // Simulate failed login
  simulateFailedLogin: (mockAuthService: any, reason = 'Invalid credentials') => {
    mockAuthService.login.mockResolvedValue({
      success: false,
      message: reason,
    });
  },

  // Simulate network error
  simulateNetworkError: (mockAuthService: any) => {
    mockAuthService.login.mockRejectedValue(new Error('Network error'));
  },

  // Verify navigation call
  verifyNavigationCall: (
    mockFunction: jest.Mock, 
    expectedUser: User, 
    expectedToken: string,
    callIndex = 0
  ) => {
    expect(mockFunction).toHaveBeenCalledWith(expectedUser, expectedToken);
    expect(mockFunction).toHaveBeenCalledTimes(callIndex + 1);
  },

  // Verify tab navigation
  verifyTabNavigation: (
    mockFunction: jest.Mock,
    expectedTab: 'home' | 'messages' | 'cart' | 'account',
    callIndex = 0
  ) => {
    expect(mockFunction).toHaveBeenNthCalledWith(callIndex + 1, expectedTab);
  },
};

// Screen Mock Factory
export const createScreenMock = (screenName: string, additionalProps: string[] = []) => {
  return jest.fn((props) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    
    const baseProps = ['user', 'token', 'onLogout'];
    const allProps = [...baseProps, ...additionalProps];
    
    return React.createElement(
      View,
      { testID: `${screenName.toLowerCase()}-screen` },
      [
        React.createElement(Text, { key: 'title' }, `${screenName} Screen`),
        ...allProps.map((prop) => {
          if (typeof props[prop] === 'function') {
            return React.createElement(
              TouchableOpacity,
              { 
                key: prop,
                onPress: props[prop],
                testID: `${prop}-button`
              },
              React.createElement(Text, null, `${prop} Button`)
            );
          }
          return React.createElement(Text, { key: prop }, `${prop}: ${JSON.stringify(props[prop])}`);
        }),
      ]
    );
  });
};

// Common Screen Mocks
export const screenMocks = {
  LoginScreen: createScreenMock('Login', ['onShowSignup']),
  SignupScreen: createScreenMock('Signup', ['onSignupSuccess', 'onBackToLogin']),
  EcommerceScreen: createScreenMock('Ecommerce'),
  CartScreen: createScreenMock('Cart', ['onNavigateToCheckout']),
  CheckoutScreen: createScreenMock('Checkout', ['onBack', 'onPaymentSuccess']),
  DriverScreen: createScreenMock('Driver'),
  StoreKeeperScreen: createScreenMock('StoreKeeper'),
  AccountScreen: createScreenMock('Account'),
};

// BottomNavigation Mock
export const mockBottomNavigation = jest.fn(({ activeTab, onTabPress }) => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'messages', label: 'Messages' },
    { id: 'cart', label: 'Cart' },
    { id: 'account', label: 'Account' },
  ];

  return React.createElement(
    View,
    { testID: 'bottom-navigation' },
    tabs.map((tab) =>
      React.createElement(
        TouchableOpacity,
        {
          key: tab.id,
          onPress: () => onTabPress(tab.id),
          testID: `${tab.id}-tab`,
          style: activeTab === tab.id ? { backgroundColor: 'blue' } : {}
        },
        React.createElement(Text, null, `${tab.label} Tab`)
      )
    )
  );
});

// Navigation Flow Test Template
export const createNavigationFlowTest = (
  testName: string,
  navigationSteps: Array<{
    action: string;
    expectation: string;
    verify: () => void;
  }>
) => {
  return {
    name: testName,
    steps: navigationSteps,
    execute: () => {
      navigationSteps.forEach((step, index) => {
        console.log(`Step ${index + 1}: ${step.action}`);
        step.verify();
        console.log(`✓ ${step.expectation}`);
      });
    }
  };
};

// Authentication Service Mock Setup
export const setupAuthServiceMock = () => {
  const mockLogin = jest.fn();
  const mockValidateEmail = jest.fn();
  
  const authServiceMock = {
    login: mockLogin,
    validateEmail: mockValidateEmail,
  };

  // Default successful responses
  mockLogin.mockResolvedValue({
    success: true,
    message: 'Login successful',
    user: mockUsers.customer,
    token: 'customer-token',
  });

  mockValidateEmail.mockReturnValue(true);

  return {
    mock: authServiceMock,
    helpers: {
      mockSuccessfulLogin: (userType: keyof typeof mockUsers = 'customer') => {
        const user = mockUsers[userType];
        mockLogin.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user,
          token: `${userType}-token`,
        });
      },
      mockFailedLogin: (message = 'Invalid credentials') => {
        mockLogin.mockResolvedValue({
          success: false,
          message,
        });
      },
      mockNetworkError: () => {
        mockLogin.mockRejectedValue(new Error('Network error'));
      },
      reset: () => {
        mockLogin.mockClear();
        mockValidateEmail.mockClear();
      }
    }
  };
};

// Cart Hook Mock Setup
export const setupCartMock = () => {
  const mockAddToCart = jest.fn();
  const mockGetCartItemCount = jest.fn(() => 0);
  const mockRemoveFromCart = jest.fn();
  const mockClearCart = jest.fn();
  
  return {
    addToCart: mockAddToCart,
    getCartItemCount: mockGetCartItemCount,
    removeFromCart: mockRemoveFromCart,
    clearCart: mockClearCart,
    helpers: {
      setCartCount: (count: number) => mockGetCartItemCount.mockReturnValue(count),
      reset: () => {
        mockAddToCart.mockClear();
        mockGetCartItemCount.mockClear();
        mockRemoveFromCart.mockClear();
        mockClearCart.mockClear();
        mockGetCartItemCount.mockReturnValue(0);
      }
    }
  };
};

// Global Mock Setup for Navigation Tests
export const setupNavigationTestEnvironment = () => {
  // Mock Animated
  const mockAnimated = {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(),
    })),
    delay: jest.fn(() => ({
      start: jest.fn(),
    })),
  };

  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ success: true, data: {} }),
  });

  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  return {
    animated: mockAnimated,
    cleanup: () => {
      Object.assign(console, originalConsole);
      delete (global as any).fetch;
    },
  };
};

// Export all utilities
export default {
  createMockUser,
  mockUsers,
  createNavigationMocks,
  createMockNavigationProps,
  navigationTestHelpers,
  createScreenMock,
  screenMocks,
  mockBottomNavigation,
  createNavigationFlowTest,
  setupAuthServiceMock,
  setupCartMock,
  setupNavigationTestEnvironment,
};