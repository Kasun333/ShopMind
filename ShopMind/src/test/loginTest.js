import { AUTH_API_URL } from '../config/apiConfig';
import { AuthService } from '../services/authService';

// Test configuration and login
console.log('=== API Configuration Test ===');
console.log('AUTH_API_URL:', AUTH_API_URL);

// Test the login function directly
async function testLogin() {
  console.log('\n=== Testing Login ===');
  try {
    const credentials = {
      username: 'Wasantha@123',
      password: 'Wasantha@123'
    };
    
    console.log('Testing with credentials:', credentials);
    
    const result = await AuthService.login(credentials);
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('User:', result.user);
      console.log('Token:', result.token);
    } else {
      console.log('❌ Login failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
  }
}

// Run the test
testLogin();
