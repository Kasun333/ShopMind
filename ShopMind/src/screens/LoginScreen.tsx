import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface LoginScreenProps {
  onLogin: (userData: User, token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
      const response = await fetch('http://10.79.191.210:8080/api/auth/login', {
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
              placeholderTextColor="#6B7280"
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
              placeholderTextColor="#6B7280"
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
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0F0F',
    opacity: 0.95,
  },
  loginCard: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
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
    color: '#E5E7EB',
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#1A1A1A',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  toast: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: width * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#374151',
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  toastIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  indicatorSuccess: {
    backgroundColor: '#10B981',
  },
  indicatorError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});