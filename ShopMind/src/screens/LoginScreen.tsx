import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated } from 'react-native';
import { User } from '../types/User';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (userData: User, token: string) => void;
  onShowSignup: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onShowSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<null | 'username' | 'password'>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [slideAnim] = useState(new Animated.Value(-300));

  const showToast = (message: string, type = 'success') => {
    setToast({ visible: true, message, type });
    
    // Slide in animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
      // Auto hide after 3 seconds
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    try {
      const response = await fetch('http://10.59.35.210:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Success value:', data.success);
      console.log('Success type:', typeof data.success);

      if (!response.ok) {
        showToast(data.message || 'Invalid credentials', 'error');
        return;
      }

      // Check if login was successful
      if (data.success === true) {
        // Handle success - call onLogin with user data and token
        showToast(`Welcome ${data.user.fullName}`, 'success');
        console.log('Token:', data.token); // store this securely later
        console.log('User data:', data.user);
        
        // Navigate to appropriate screen based on role
        onLogin(data.user, data.token);
      } else {
        showToast(data.message || 'Something went wrong', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Could not connect to server', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient} />
      
      {/* Custom Toast */}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess : styles.toastError,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={[
            styles.toastIndicator,
            toast.type === 'success' ? styles.indicatorSuccess : styles.indicatorError
          ]} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
      
      <View style={styles.loginCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'username' && styles.inputFocused
              ]}
              placeholder="Enter your username"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused
              ]}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={onShowSignup}>
            <Text style={styles.signupButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    opacity: 0.95,
  },
  loginCard: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  signupButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
  },
  signupButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: width * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  toastIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  indicatorSuccess: {
    backgroundColor: '#16A34A',
  },
  indicatorError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});