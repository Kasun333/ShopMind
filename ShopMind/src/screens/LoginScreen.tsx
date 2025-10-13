import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from '../types/User';
import { AuthService } from '../services/authService';

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
  const [isLoading, setIsLoading] = useState(false);

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
    // Trim whitespace from inputs
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    if (!cleanUsername || !cleanPassword) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('LoginScreen - Attempting login with:', { username: cleanUsername, password: cleanPassword });
      const result = await AuthService.login({ username: cleanUsername, password: cleanPassword });
      console.log('LoginScreen - AuthService result:', result);
      
      if (result.success && result.user && result.token) {
        showToast(`Welcome ${result.user.fullName}`, 'success');
        console.log('Token:', result.token);
        console.log('User data:', result.user);
        
        // Navigate to appropriate screen based on role
        onLogin(result.user, result.token);
      } else {
        console.log('LoginScreen - Login failed. Success:', result.success, 'User:', !!result.user, 'Token:', !!result.token);
        showToast(result.message || 'Something went wrong', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Could not connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
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
                focusedInput === 'username' && styles.inputFocused,
                isLoading && styles.inputDisabled
              ]}
              placeholder="Enter your username"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused,
                isLoading && styles.inputDisabled
              ]}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#94A3B8', '#64748B'] : ['#2A7CC7', '#1E6091']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPassword}
            disabled={isLoading}
          >
            <Text style={[styles.forgotPasswordText, isLoading && styles.disabledText]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]} 
            onPress={onShowSignup}
            disabled={isLoading}
          >
            <Text style={[styles.signupButtonText, isLoading && styles.disabledText]}>
              Create New Account
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loginCard: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#1E6091',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E6091',
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
    color: '#1E6091',
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
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  inputFocused: {
    borderColor: '#3B95E3',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B95E3',
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#1E6091',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#2A7CC7',
    fontSize: 14,
    fontWeight: '500',
  },
  signupButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#2A7CC7',
    borderRadius: 12,
    backgroundColor: 'rgba(42, 124, 199, 0.05)',
  },
  signupButtonDisabled: {
    opacity: 0.5,
    borderColor: '#94A3B8',
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  signupButtonText: {
    color: '#2A7CC7',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#94A3B8',
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