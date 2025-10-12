import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { AuthService } from '../services/authService';

// Mock AuthService
jest.mock('../services/authService');
const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock Animated by using global setup

describe('LoginScreen', () => {
  const mockOnLogin = jest.fn();
  const mockOnShowSignup = jest.fn();

  const defaultProps = {
    onLogin: mockOnLogin,
    onShowSignup: mockOnShowSignup,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with all elements', () => {
      render(<LoginScreen {...defaultProps} />);
      
      expect(screen.getByText('Welcome Back')).toBeTruthy();
      expect(screen.getByText('Sign in to your account')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your username')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('renders input labels correctly', () => {
      render(<LoginScreen {...defaultProps} />);
      
      expect(screen.getByText('Username')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
    });
  });

  describe('Input Validation', () => {
    it('shows error when username is empty', async () => {
      render(<LoginScreen {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeTruthy();
      });
    });

    it('shows error when password is empty', async () => {
      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeTruthy();
      });
    });

    it('shows error when both fields are empty', async () => {
      render(<LoginScreen {...defaultProps} />);
      
      const loginButton = screen.getByText('Sign In');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeTruthy();
      });
    });

    it('trims whitespace from inputs', async () => {
      const mockLoginResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'customer',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1990-01-01',
          formattedAddress: '123 Test St',
          latitude: 0,
          longitude: 0,
          phoneNumber: '1234567890',
          profileImageUrl: 'https://example.com/avatar.jpg'
        },
        token: 'mock-token'
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, '  testuser  ');
      fireEvent.changeText(passwordInput, '  password123  ');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123'
        });
      });
    });
  });

  describe('Login Functionality', () => {
    it('calls AuthService.login with correct credentials', async () => {
      const mockLoginResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'customer',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1990-01-01',
          formattedAddress: '123 Test St',
          latitude: 0,
          longitude: 0,
          phoneNumber: '1234567890',
          profileImageUrl: 'https://example.com/avatar.jpg'
        },
        token: 'mock-token'
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123'
        });
      });
    });

    it('calls onLogin with user data and token on successful login', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'customer',
        accountStatus: 'active',
        createdAt: '2024-01-01',
        dateOfBirth: '1990-01-01',
        formattedAddress: '123 Test St',
        latitude: 0,
        longitude: 0,
        phoneNumber: '1234567890',
        profileImageUrl: 'https://example.com/avatar.jpg'
      };

      const mockLoginResponse = {
        success: true,
        message: 'Login successful',
        user: mockUser,
        token: 'mock-token'
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(mockUser, 'mock-token');
      });
    });

    it('shows welcome message on successful login', async () => {
      const mockLoginResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'customer',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1990-01-01',
          formattedAddress: '123 Test St',
          latitude: 0,
          longitude: 0,
          phoneNumber: '1234567890',
          profileImageUrl: 'https://example.com/avatar.jpg'
        },
        token: 'mock-token'
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Test User')).toBeTruthy();
      });
    });

    it('shows error message on failed login', async () => {
      const mockLoginResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeTruthy();
      });
    });

    it('shows network error message when AuthService throws', async () => {
      mockedAuthService.login.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Could not connect to server')).toBeTruthy();
      });
    });

    it('shows default error when login response has no message', async () => {
      const mockLoginResponse = {
        success: false,
        message: '',
      };

      mockedAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const loginButton = screen.getByText('Sign In');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeTruthy();
      });
    });
  });

  describe('Input Focus States', () => {
    it('handles username input focus and blur', () => {
      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      
      fireEvent(usernameInput, 'focus');
      fireEvent(usernameInput, 'blur');
      
      // Component should handle focus states without crashing
      expect(usernameInput).toBeTruthy();
    });

    it('handles password input focus and blur', () => {
      render(<LoginScreen {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      fireEvent(passwordInput, 'focus');
      fireEvent(passwordInput, 'blur');
      
      // Component should handle focus states without crashing
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('Text Input Changes', () => {
    it('updates username state when text changes', () => {
      render(<LoginScreen {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      
      fireEvent.changeText(usernameInput, 'newusername');
      
      expect(usernameInput.props.value).toBe('newusername');
    });

    it('updates password state when text changes', () => {
      render(<LoginScreen {...defaultProps} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      fireEvent.changeText(passwordInput, 'newpassword');
      
      expect(passwordInput.props.value).toBe('newpassword');
    });
  });

  describe('Navigation Tests', () => {
    beforeEach(() => {
      mockOnLogin.mockClear();
      mockOnShowSignup.mockClear();
    });

    describe('Successful Login Navigation', () => {
      it('calls onLogin with correct parameters for Driver user', async () => {
        const driverUser = {
          id: '1',
          username: 'driveruser',
          email: 'driver@example.com',
          fullName: 'Driver User',
          role: 'Driver',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1985-01-01',
          formattedAddress: '456 Driver St',
          latitude: 40.7128,
          longitude: -74.0060,
          phoneNumber: '9876543210',
          profileImageUrl: 'https://example.com/driver.jpg'
        };

        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: driverUser,
          token: 'driver-token'
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'driveruser');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(mockOnLogin).toHaveBeenCalledWith(driverUser, 'driver-token');
        });

        expect(mockOnLogin).toHaveBeenCalledTimes(1);
      });

      it('calls onLogin with correct parameters for Customer user', async () => {
        const customerUser = {
          id: '2',
          username: 'customer',
          email: 'customer@example.com',
          fullName: 'Customer User',
          role: 'User',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1990-01-01',
          formattedAddress: '789 Customer Ave',
          latitude: 34.0522,
          longitude: -118.2437,
          phoneNumber: '5551234567',
          profileImageUrl: 'https://example.com/customer.jpg'
        };

        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: customerUser,
          token: 'customer-token'
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'customer');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(mockOnLogin).toHaveBeenCalledWith(customerUser, 'customer-token');
        });

        expect(mockOnLogin).toHaveBeenCalledTimes(1);
      });

      it('calls onLogin with correct parameters for Store Keeper user', async () => {
        const storeKeeperUser = {
          id: '3',
          username: 'storekeeper',
          email: 'keeper@example.com',
          fullName: 'Store Keeper User',
          role: 'Store Keeper',
          accountStatus: 'active',
          createdAt: '2024-01-01',
          dateOfBirth: '1980-01-01',
          formattedAddress: '321 Store St',
          latitude: 41.8781,
          longitude: -87.6298,
          phoneNumber: '3339876543',
          profileImageUrl: 'https://example.com/keeper.jpg'
        };

        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: storeKeeperUser,
          token: 'keeper-token'
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'storekeeper');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(mockOnLogin).toHaveBeenCalledWith(storeKeeperUser, 'keeper-token');
        });

        expect(mockOnLogin).toHaveBeenCalledTimes(1);
      });

      it('does not navigate when login fails', async () => {
        mockedAuthService.login.mockResolvedValue({
          success: false,
          message: 'Invalid credentials'
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'wronguser');
        fireEvent.changeText(passwordInput, 'wrongpassword');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(screen.getByText('Invalid credentials')).toBeTruthy();
        });

        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });

    describe('Signup Navigation', () => {
      it('navigates to signup screen when signup link is pressed', () => {
        render(<LoginScreen {...defaultProps} />);
        
        // Find and press the signup link
        const signupLink = screen.getByText('Create New Account');
        fireEvent.press(signupLink);

        expect(mockOnShowSignup).toHaveBeenCalledTimes(1);
      });

      it('shows signup text and link correctly', () => {
        render(<LoginScreen {...defaultProps} />);
        
        expect(screen.getByText('Create New Account')).toBeTruthy();
        expect(screen.getByText('Forgot your password?')).toBeTruthy();
      });

      it('handles multiple signup navigation calls', () => {
        render(<LoginScreen {...defaultProps} />);
        
        const signupLink = screen.getByText('Create New Account');
        
        fireEvent.press(signupLink);
        fireEvent.press(signupLink);
        fireEvent.press(signupLink);

        expect(mockOnShowSignup).toHaveBeenCalledTimes(3);
      });
    });

    describe('Navigation Error Handling', () => {
      it('does not navigate when onLogin callback is not provided', async () => {
        const propsWithoutOnLogin = {
          onLogin: undefined as any,
          onShowSignup: mockOnShowSignup,
        };

        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: {
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
            profileImageUrl: 'https://example.com/avatar.jpg'
          },
          token: 'mock-token'
        });

        render(<LoginScreen {...propsWithoutOnLogin} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'password123');
        
        // This should not crash the app
        expect(() => {
          fireEvent.press(loginButton);
        }).not.toThrow();
      });

      it('handles missing user data gracefully', async () => {
        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: null as any,
          token: 'mock-token'
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(screen.getByText('Login successful')).toBeTruthy();
        });

        // Should not call onLogin since user is missing
        expect(mockOnLogin).not.toHaveBeenCalled();
      });

      it('handles missing token gracefully', async () => {
        mockedAuthService.login.mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: {
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
            profileImageUrl: 'https://example.com/avatar.jpg'
          },
          token: null as any
        });

        render(<LoginScreen {...defaultProps} />);
        
        const usernameInput = screen.getByPlaceholderText('Enter your username');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByText('Sign In');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(screen.getByText('Login successful')).toBeTruthy();
        });

        // Should not call onLogin since token is missing
        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });
  });
});