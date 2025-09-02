import { AUTH_API_URL, EXTERNAL_APIS } from '../config/apiConfig';
import { User } from '../types/User';

// Email verification API key - this should be in environment variables in production
const EMAIL_VERIFIER_API_KEY = 'c30cbd8e6e674d8d926df21f80918395';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: string;
  latitude?: number;
  longitude?: number;
  profileImageUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface EmailValidationResponse {
  email: string;
  autocorrect: string;
  deliverability: string;
  quality_score: number;
  is_valid_format: {
    value: boolean;
    text: string;
  };
  is_free_email: {
    value: boolean;
    text: string;
  };
  is_disposable_email: {
    value: boolean;
    text: string;
  };
  is_role_email: {
    value: boolean;
    text: string;
  };
  is_catchall_email: {
    value: boolean;
    text: string;
  };
  is_mx_found: {
    value: boolean;
    text: string;
  };
  is_smtp_valid: {
    value: boolean;
    text: string;
  };
}

export class AuthService {
  /**
   * Validates email using external API
   */
  static async validateEmail(email: string): Promise<boolean> {
    try {
      const url = `${EXTERNAL_APIS.EMAIL_VERIFICATION}?api_key=${EMAIL_VERIFIER_API_KEY}&email=${email}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log('Email validation API error:', response.status);
        return true; // Default to valid if API fails
      }
      
      const result: EmailValidationResponse = await response.json();
      
      // Check if email format is valid and it's not disposable
      const isValidFormat = result.is_valid_format?.value === true;
      const isNotDisposable = result.is_disposable_email?.value === false;
      const qualityScore = result.quality_score || 0;
      
      return isValidFormat && isNotDisposable && qualityScore > 0.7;
    } catch (error) {
      console.error('Email validation error:', error);
      return true; // Default to valid if validation fails
    }
  }

  /**
   * User login
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Trim whitespace from credentials
      const cleanCredentials = {
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      };
      
      console.log('AuthService.login - Using URL:', `${AUTH_API_URL}/api/auth/login`);
      console.log('AuthService.login - Original credentials:', credentials);
      console.log('AuthService.login - Clean credentials:', cleanCredentials);
      
      const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanCredentials),
      });

      console.log('AuthService.login - Response status:', response.status);
      console.log('AuthService.login - Response ok:', response.ok);
      
      const data = await response.json();
      console.log('AuthService.login - Response data:', data);
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Invalid credentials',
        };
      }

      const result = {
        success: data.success === true,
        message: data.message || 'Login successful',
        user: data.user,
        token: data.token,
      };
      
      console.log('AuthService.login - Final result:', result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Could not connect to server',
      };
    }
  }

  /**
   * User signup
   */
  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      const requestBody = {
        ...userData,
        latitude: userData.latitude || 6.9271,
        longitude: userData.longitude || 79.8612,
        profileImageUrl: userData.profileImageUrl || "https://example.com/profile.jpg"
      };
      
      console.log('Signup request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${AUTH_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            console.log('Failed to parse JSON, treating as plain text:', responseText);
            // Backend sent content-type as JSON but response is plain text
            if (response.ok && responseText.includes('successfully')) {
              return {
                success: true,
                message: 'Account created successfully',
              };
            } else {
              return {
                success: false,
                message: responseText || 'Signup failed',
              };
            }
          }
        } else {
          // Plain text response
          if (response.ok && responseText.includes('successfully')) {
            return {
              success: true,
              message: 'Account created successfully',
            };
          } else {
            return {
              success: false,
              message: responseText || 'Signup failed',
            };
          }
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        return {
          success: false,
          message: 'Error processing server response',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data?.message || 'Signup failed',
        };
      }

      return {
        success: data?.success === true,
        message: data?.message || 'Account created successfully',
        user: data?.user,
        token: data?.token,
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Could not connect to server',
      };
    }
  }

  /**
   * Logout user (clear local storage, invalidate token, etc.)
   */
  static async logout(): Promise<void> {
    try {
      // Clear any stored tokens or user data
      // In a real app, you might want to call a logout endpoint
      // and clear AsyncStorage or other persistent storage
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      // In a real app, you would check if a valid token exists
      // and possibly validate it with the server
      // For now, returning false
      return false;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user data from token
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // In a real app, you would decode the JWT token
      // or make an API call to get current user data
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}
