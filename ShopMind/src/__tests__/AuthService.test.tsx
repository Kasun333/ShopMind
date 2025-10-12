import { AuthService, LoginRequest, SignupRequest } from '../services/authService';
import { AUTH_API_URL } from '../config/apiConfig';

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    };

    it('makes correct API call with trimmed credentials', async () => {
      const mockResponse = {
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
        token: 'mock-jwt-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await AuthService.login(mockCredentials);

      expect(fetch).toHaveBeenCalledWith(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        user: mockResponse.user,
        token: 'mock-jwt-token',
      });
    });

    it('trims whitespace from credentials', async () => {
      const credentialsWithWhitespace: LoginRequest = {
        username: '  testuser  ',
        password: '  password123  ',
      };

      const mockResponse = {
        success: true,
        message: 'Login successful',
        user: {},
        token: 'mock-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await AuthService.login(credentialsWithWhitespace);

      expect(fetch).toHaveBeenCalledWith(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });
    });

    it('handles successful login response', async () => {
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

      const mockResponse = {
        success: true,
        message: 'Login successful',
        user: mockUser,
        token: 'mock-jwt-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await AuthService.login(mockCredentials);

      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        user: mockUser,
        token: 'mock-jwt-token',
      });
    });

    it('handles failed login response with custom message', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid username or password',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      const result = await AuthService.login(mockCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Invalid username or password',
      });
    });

    it('handles failed login response without message', async () => {
      const mockResponse = {
        success: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      const result = await AuthService.login(mockCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Invalid credentials',
      });
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await AuthService.login(mockCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Could not connect to server',
      });
    });

    it('handles non-JSON response errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await AuthService.login(mockCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Could not connect to server',
      });
    });

    it('handles responses with different success values', async () => {
      const mockResponse = {
        success: 'true', // String instead of boolean
        message: 'Login successful',
        user: {},
        token: 'mock-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await AuthService.login(mockCredentials);

      expect(result.success).toBe(false); // Should be false since 'true' !== true
    });
  });

  describe('validateEmail', () => {
    const validEmailResponse = {
      email: 'test@example.com',
      autocorrect: '',
      deliverability: 'DELIVERABLE',
      quality_score: 0.99,
      is_valid_format: { value: true, text: 'TRUE' },
      is_free_email: { value: false, text: 'FALSE' },
      is_disposable_email: { value: false, text: 'FALSE' },
      is_role_email: { value: false, text: 'FALSE' },
      is_catchall_email: { value: false, text: 'FALSE' },
      is_mx_found: { value: true, text: 'TRUE' },
      is_smtp_valid: { value: true, text: 'TRUE' },
    };

    it('validates a good email successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validEmailResponse,
      });

      const result = await AuthService.validateEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('rejects disposable email', async () => {
      const disposableEmailResponse = {
        ...validEmailResponse,
        is_disposable_email: { value: true, text: 'TRUE' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => disposableEmailResponse,
      });

      const result = await AuthService.validateEmail('test@tempmail.com');

      expect(result).toBe(false);
    });

    it('rejects invalid format email', async () => {
      const invalidFormatResponse = {
        ...validEmailResponse,
        is_valid_format: { value: false, text: 'FALSE' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidFormatResponse,
      });

      const result = await AuthService.validateEmail('invalid-email');

      expect(result).toBe(false);
    });

    it('rejects low quality score email', async () => {
      const lowQualityResponse = {
        ...validEmailResponse,
        quality_score: 0.5,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => lowQualityResponse,
      });

      const result = await AuthService.validateEmail('test@example.com');

      expect(result).toBe(false);
    });

    it('defaults to valid when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await AuthService.validateEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('defaults to valid when API returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await AuthService.validateEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('handles missing properties in API response', async () => {
      const incompleteResponse = {
        email: 'test@example.com',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => incompleteResponse,
      });

      const result = await AuthService.validateEmail('test@example.com');

      expect(result).toBe(false); // Should be false due to missing required properties
    });
  });
});