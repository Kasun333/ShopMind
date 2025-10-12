import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { 
  createMockUser, 
  mockUsers, 
  navigationTestHelpers,
  setupAuthServiceMock,
  setupNavigationTestEnvironment
} from './utils/navigationTestUtils';

// Mock the main App component functionality
jest.mock('../screens/LoginScreen', () => {
  return jest.fn(({ onLogin, onShowSignup }) => {
    const { View, Text, TouchableOpacity, TextInput } = require('react-native');
    return (
      <View testID="login-screen">
        <Text>Login Screen</Text>
        <TextInput placeholder="Username" testID="username-input" />
        <TextInput placeholder="Password" testID="password-input" />
        <TouchableOpacity 
          onPress={() => onLogin(mockUsers.customer, 'customer-token')} 
          testID="login-button"
        >
          <Text>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShowSignup} testID="signup-link">
          <Text>Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

jest.mock('../screens/SignupScreen', () => {
  return jest.fn(({ onSignupSuccess, onBackToLogin }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="signup-screen">
        <Text>Signup Screen</Text>
        <TouchableOpacity onPress={onSignupSuccess} testID="signup-button">
          <Text>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBackToLogin} testID="back-to-login">
          <Text>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

jest.mock('../screens/EcommerceScreen', () => {
  return jest.fn(({ user, token, onLogout }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="ecommerce-screen">
        <Text>Ecommerce Screen</Text>
        <Text testID="user-info">Welcome {user?.fullName}</Text>
        <TouchableOpacity onPress={onLogout} testID="logout-button">
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

jest.mock('../screens/DriverScreen', () => {
  return jest.fn(({ user, token, onLogout }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="driver-screen">
        <Text>Driver Screen</Text>
        <Text testID="user-info">Welcome Driver {user?.fullName}</Text>
        <TouchableOpacity onPress={onLogout} testID="logout-button">
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

jest.mock('../screens/StoreKeeperScreen', () => {
  return jest.fn(({ user, token, onLogout }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="storekeeper-screen">
        <Text>Store Keeper Screen</Text>
        <Text testID="user-info">Welcome {user?.fullName}</Text>
        <TouchableOpacity onPress={onLogout} testID="logout-button">
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

// Create a simplified App component for testing
const TestApp: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [showSignup, setShowSignup] = React.useState(false);

  const LoginScreen = require('../screens/LoginScreen');
  const SignupScreen = require('../screens/SignupScreen');
  const EcommerceScreen = require('../screens/EcommerceScreen');
  const DriverScreen = require('../screens/DriverScreen');
  const StoreKeeperScreen = require('../screens/StoreKeeperScreen');

  const handleLogin = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowSignup(false);
  };

  const handleShowSignup = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
  };

  // Not logged in - show login or signup
  if (!user || !token) {
    if (showSignup) {
      return (
        <SignupScreen 
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onShowSignup={handleShowSignup}
      />
    );
  }

  // Logged in - show appropriate screen based on role
  switch (user.role) {
    case 'Driver':
      return <DriverScreen user={user} token={token} onLogout={handleLogout} />;
    case 'Store Keeper':
      return <StoreKeeperScreen user={user} token={token} onLogout={handleLogout} />;
    case 'User':
    default:
      return <EcommerceScreen user={user} token={token} onLogout={handleLogout} />;
  }
};

describe('Full App Navigation Integration Tests', () => {
  let testEnv: any;

  beforeAll(() => {
    testEnv = setupNavigationTestEnvironment();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow Navigation', () => {
    it('navigates through complete login flow for customer user', async () => {
      render(<TestApp />);
      
      // Should start at login screen
      expect(screen.getByTestId('login-screen')).toBeTruthy();
      expect(screen.getByText('Login Screen')).toBeTruthy();
      
      // Perform login
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);
      
      // Should navigate to ecommerce screen
      await waitFor(() => {
        expect(screen.getByTestId('ecommerce-screen')).toBeTruthy();
      });
      
      expect(screen.getByText('Welcome Test User')).toBeTruthy();
    });

    it('navigates to signup and back to login', async () => {
      render(<TestApp />);
      
      // Start at login
      expect(screen.getByTestId('login-screen')).toBeTruthy();
      
      // Navigate to signup
      const signupLink = screen.getByTestId('signup-link');
      fireEvent.press(signupLink);
      
      await waitFor(() => {
        expect(screen.getByTestId('signup-screen')).toBeTruthy();
      });
      
      // Navigate back to login
      const backToLogin = screen.getByTestId('back-to-login');
      fireEvent.press(backToLogin);
      
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });

    it('completes signup flow and returns to login', async () => {
      render(<TestApp />);
      
      // Navigate to signup
      fireEvent.press(screen.getByTestId('signup-link'));
      
      await waitFor(() => {
        expect(screen.getByTestId('signup-screen')).toBeTruthy();
      });
      
      // Complete signup
      const signupButton = screen.getByTestId('signup-button');
      fireEvent.press(signupButton);
      
      // Should return to login
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });
  });

  describe('Role-Based Navigation', () => {
    it('navigates to driver screen for driver users', async () => {
      const DriverScreen = require('../screens/DriverScreen');
      const LoginScreen = require('../screens/LoginScreen');
      
      // Mock login to return driver user
      LoginScreen.mockImplementation(({ onLogin }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
          <View testID="login-screen">
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.driver, 'driver-token')} 
              testID="login-as-driver"
            >
              <Text>Login as Driver</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login as driver
      fireEvent.press(screen.getByTestId('login-as-driver'));
      
      // Should navigate to driver screen
      await waitFor(() => {
        expect(screen.getByTestId('driver-screen')).toBeTruthy();
      });
      
      expect(screen.getByText('Welcome Driver Driver User')).toBeTruthy();
    });

    it('navigates to store keeper screen for store keeper users', async () => {
      const StoreKeeperScreen = require('../screens/StoreKeeperScreen');
      const LoginScreen = require('../screens/LoginScreen');
      
      // Mock login to return store keeper user
      LoginScreen.mockImplementation(({ onLogin }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
          <View testID="login-screen">
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.storeKeeper, 'keeper-token')} 
              testID="login-as-keeper"
            >
              <Text>Login as Store Keeper</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login as store keeper
      fireEvent.press(screen.getByTestId('login-as-keeper'));
      
      // Should navigate to store keeper screen
      await waitFor(() => {
        expect(screen.getByTestId('storekeeper-screen')).toBeTruthy();
      });
      
      expect(screen.getByText('Welcome Store Keeper')).toBeTruthy();
    });
  });

  describe('Logout Navigation', () => {
    it('logs out and returns to login screen from ecommerce', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Reset LoginScreen mock to default customer login
      LoginScreen.mockImplementation(({ onLogin, onShowSignup }: any) => {
        const { View, Text, TouchableOpacity, TextInput } = require('react-native');
        return (
          <View testID="login-screen">
            <Text>Login Screen</Text>
            <TextInput placeholder="Username" testID="username-input" />
            <TextInput placeholder="Password" testID="password-input" />
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.customer, 'customer-token')} 
              testID="login-button"
            >
              <Text>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShowSignup} testID="signup-link">
              <Text>Sign Up</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login first
      fireEvent.press(screen.getByTestId('login-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ecommerce-screen')).toBeTruthy();
      });
      
      // Logout
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.press(logoutButton);
      
      // Should return to login
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });

    it('logs out and returns to login screen from driver screen', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Mock login to return driver user
      LoginScreen.mockImplementation(({ onLogin }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
          <View testID="login-screen">
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.driver, 'driver-token')} 
              testID="login-button"
            >
              <Text>Login as Driver</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login as driver
      fireEvent.press(screen.getByTestId('login-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('driver-screen')).toBeTruthy();
      });
      
      // Logout
      fireEvent.press(screen.getByTestId('logout-button'));
      
      // Should return to login
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });
  });

  describe('State Persistence and Parameter Passing', () => {
    it('maintains user data across navigation', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Reset LoginScreen mock to default customer login
      LoginScreen.mockImplementation(({ onLogin, onShowSignup }: any) => {
        const { View, Text, TouchableOpacity, TextInput } = require('react-native');
        return (
          <View testID="login-screen">
            <Text>Login Screen</Text>
            <TextInput placeholder="Username" testID="username-input" />
            <TextInput placeholder="Password" testID="password-input" />
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.customer, 'customer-token')} 
              testID="login-button"
            >
              <Text>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShowSignup} testID="signup-link">
              <Text>Sign Up</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login
      fireEvent.press(screen.getByTestId('login-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ecommerce-screen')).toBeTruthy();
      });
      
      // User name should be displayed correctly
      expect(screen.getByText('Welcome Test User')).toBeTruthy();
      
      // User data should be preserved in the component
      const EcommerceScreen = require('../screens/EcommerceScreen');
      const lastCall = EcommerceScreen.mock.calls[EcommerceScreen.mock.calls.length - 1];
      const [props] = lastCall;
      
      expect(props.user.fullName).toBe('Test User');
      expect(props.user.role).toBe('User');
      expect(props.token).toBe('customer-token');
    });

    it('clears user data on logout', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Reset LoginScreen mock to default customer login
      LoginScreen.mockImplementation(({ onLogin, onShowSignup }: any) => {
        const { View, Text, TouchableOpacity, TextInput } = require('react-native');
        return (
          <View testID="login-screen">
            <Text>Login Screen</Text>
            <TextInput placeholder="Username" testID="username-input" />
            <TextInput placeholder="Password" testID="password-input" />
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.customer, 'customer-token')} 
              testID="login-button"
            >
              <Text>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShowSignup} testID="signup-link">
              <Text>Sign Up</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Login
      fireEvent.press(screen.getByTestId('login-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ecommerce-screen')).toBeTruthy();
      });
      
      // Logout
      fireEvent.press(screen.getByTestId('logout-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
      
      // Should not show user info anymore
      expect(screen.queryByText('Welcome Test User')).toBeNull();
    });

    it('handles navigation state reset correctly', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Reset LoginScreen mock to default
      LoginScreen.mockImplementation(({ onLogin, onShowSignup }: any) => {
        const { View, Text, TouchableOpacity, TextInput } = require('react-native');
        return (
          <View testID="login-screen">
            <Text>Login Screen</Text>
            <TextInput placeholder="Username" testID="username-input" />
            <TextInput placeholder="Password" testID="password-input" />
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.customer, 'customer-token')} 
              testID="login-button"
            >
              <Text>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShowSignup} testID="signup-link">
              <Text>Sign Up</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Go through signup flow
      fireEvent.press(screen.getByTestId('signup-link'));
      
      await waitFor(() => {
        expect(screen.getByTestId('signup-screen')).toBeTruthy();
      });
      
      // Go back to login
      fireEvent.press(screen.getByTestId('back-to-login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
      
      // State should be properly reset - signup screen should not be shown
      expect(screen.queryByTestId('signup-screen')).toBeNull();
    });
  });

  describe('Error Handling in Navigation', () => {
    it('handles navigation with missing user data gracefully', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Mock login to return null user
      LoginScreen.mockImplementation(({ onLogin }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
          <View testID="login-screen">
            <TouchableOpacity 
              onPress={() => onLogin(null, 'some-token')} 
              testID="login-with-null-user"
            >
              <Text>Login with null user</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Try to login with null user
      fireEvent.press(screen.getByTestId('login-with-null-user'));
      
      // Should remain on login screen
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });

    it('handles navigation with missing token gracefully', async () => {
      const LoginScreen = require('../screens/LoginScreen');
      
      // Mock login to return null token
      LoginScreen.mockImplementation(({ onLogin }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
          <View testID="login-screen">
            <TouchableOpacity 
              onPress={() => onLogin(mockUsers.customer, null)} 
              testID="login-with-null-token"
            >
              <Text>Login with null token</Text>
            </TouchableOpacity>
          </View>
        );
      });
      
      render(<TestApp />);
      
      // Try to login with null token
      fireEvent.press(screen.getByTestId('login-with-null-token'));
      
      // Should remain on login screen
      await waitFor(() => {
        expect(screen.getByTestId('login-screen')).toBeTruthy();
      });
    });
  });
});