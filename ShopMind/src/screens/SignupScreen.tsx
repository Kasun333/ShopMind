import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    profileImageUrl: '',
    latitude: '',
    longitude: '',
    formattedAddress: '',
    dateOfBirth: ''
  });
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [slideAnim] = useState(new Animated.Value(-300));
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message: string, type = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { username, email, password, fullName, phoneNumber, formattedAddress, dateOfBirth } = formData;
    
    if (!username.trim()) {
      showToast('Username is required', 'error');
      return false;
    }
    
    if (!email.trim() || !email.includes('@')) {
      showToast('Valid email is required', 'error');
      return false;
    }
    
    if (!password.trim() || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    
    if (!fullName.trim()) {
      showToast('Full name is required', 'error');
      return false;
    }
    
    if (!phoneNumber.trim()) {
      showToast('Phone number is required', 'error');
      return false;
    }
    
    if (!formattedAddress.trim()) {
      showToast('Address is required', 'error');
      return false;
    }
    
    if (!dateOfBirth.trim()) {
      showToast('Date of birth is required', 'error');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const requestBody = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : 6.9271,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 79.8612,
        profileImageUrl: formData.profileImageUrl || "https://example.com/profile.jpg"
      };
      
      console.log('Signup request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('http://10.79.191.210:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (contentType && contentType.includes('application/json')) {
          data = JSON.parse(responseText);
        } else {
          // Server returned plain text response
          console.log('Server returned plain text:', responseText);
          
          // Check if signup was successful based on response status and text
          if (response.ok && responseText.includes('successfully')) {
            showToast('Account created successfully! Please login.', 'success');
            setTimeout(() => {
              onSignupSuccess();
            }, 2000);
            return;
          } else {
            showToast(responseText || 'Signup failed', 'error');
            return;
          }
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        showToast('Server returned invalid response', 'error');
        return;
      }

      console.log('Parsed signup response:', data);

      if (!response.ok) {
        showToast(data.message || 'Signup failed', 'error');
        return;
      }

      if (data.success || response.status === 201 || response.ok) {
        showToast('Account created successfully! Please login.', 'success');
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      } else {
        showToast(data.message || 'Something went wrong', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('Could not connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    keyboardType: any = 'default',
    secureTextEntry = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focusedInput === field && styles.inputFocused
        ]}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        value={formData[field as keyof typeof formData]}
        onChangeText={(value) => updateField(field, value)}
        onFocus={() => setFocusedInput(field)}
        onBlur={() => setFocusedInput(null)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.signupCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join ShopMind today</Text>
          </View>

          <View style={styles.form}>
            {renderInput('Full Name', 'fullName', 'Enter your full name')}
            {renderInput('Username', 'username', 'Choose a username')}
            {renderInput('Email', 'email', 'Enter your email address', 'email-address')}
            {renderInput('Phone Number', 'phoneNumber', '+1234567890', 'phone-pad')}
            {renderInput('Password', 'password', 'Create a secure password', 'default', true)}
            {renderInput('Address', 'formattedAddress', 'Enter your address')}
            {renderInput('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD (e.g., 1990-01-15)')}
            
            {/* Optional fields */}
            <View style={styles.optionalSection}>
              <Text style={styles.optionalTitle}>Optional Information</Text>
              {renderInput('Profile Image URL', 'profileImageUrl', 'https://example.com/image.jpg')}
              {renderInput('Latitude', 'latitude', '6.9271 (optional)', 'numeric')}
              {renderInput('Longitude', 'longitude', '79.8612 (optional)', 'numeric')}
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, isLoading && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLogin} onPress={onBackToLogin}>
              <Text style={styles.backToLoginText}>
                Already have an account? <Text style={styles.loginLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  signupCard: {
    width: '100%',
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
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
    gap: 20,
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
    height: 52,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
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
  optionalSection: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  signupButton: {
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0.1,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: '#3B82F6',
    fontWeight: '600',
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
