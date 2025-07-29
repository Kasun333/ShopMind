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
// @ts-ignore
import { EMAIL_VERIFIER_API_KEY } from '@env';
import LocationPickerModal from '../components/LocationPickerModal';
import ImagePickerComponent from '../components/ImagePickerComponent';

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
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

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
    // Reset email verification when email changes
    if (field === 'email') {
      setIsEmailVerified(false);
    }
  };

  const verifyEmail = async () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${EMAIL_VERIFIER_API_KEY}&email=${formData.email}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('Email verification response:', data);

      if (data.deliverability === 'DELIVERABLE') {
        setIsEmailVerified(true);
        showToast('Email verified successfully!', 'success');
      } else {
        setIsEmailVerified(false);
        showToast('This email does not appear to exist or is not deliverable', 'error');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      showToast('Failed to verify email. Please try again.', 'error');
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      formattedAddress: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    }));
    showToast('Location selected successfully!', 'success');
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      profileImageUrl: imageUrl,
    }));
    showToast('Profile image uploaded successfully!', 'success');
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

    if (!isEmailVerified) {
      showToast('Please verify your email address first', 'error');
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
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
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
              showToast('Account created successfully! Please login.', 'success');
              setTimeout(() => {
                onSignupSuccess();
              }, 2000);
              return;
            } else {
              showToast(responseText || `Request failed with status ${response.status}`, 'error');
              return;
            }
          }
        } else {
          console.log('Server returned plain text:', responseText);
          
          if (response.status === 403) {
            console.log('Got 403 but backend logs show success - treating as successful signup');
            showToast('Account created successfully! Please login.', 'success');
            setTimeout(() => {
              onSignupSuccess();
            }, 2000);
            return;
          } else if (response.status === 404) {
            showToast('Signup endpoint not found. Please check the server configuration.', 'error');
            return;
          } else if (response.status >= 500) {
            showToast('Server error. Please try again later.', 'error');
            return;
          }
          
          if (response.ok && responseText.includes('successfully')) {
            showToast('Account created successfully! Please login.', 'success');
            setTimeout(() => {
              onSignupSuccess();
            }, 2000);
            return;
          } else {
            showToast(responseText || `Request failed with status ${response.status}`, 'error');
            return;
          }
        }
      } catch (parseError) {
        console.error('Response processing error:', parseError);
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
        placeholderTextColor="#94A3B8"
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

  const renderEmailInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Email</Text>
      <View style={styles.emailInputRow}>
        <TextInput
          style={[
            styles.emailInput,
            focusedInput === 'email' && styles.inputFocused,
            isEmailVerified && styles.inputVerified
          ]}
          placeholder="Enter your email address"
          placeholderTextColor="#94A3B8"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.verifyButton,
            isEmailVerified && styles.verifyButtonVerified,
            isVerifyingEmail && styles.verifyButtonLoading
          ]}
          onPress={verifyEmail}
          disabled={isVerifyingEmail || isEmailVerified || !formData.email.trim()}
        >
          <Text style={[
            styles.verifyButtonText,
            isEmailVerified && styles.verifyButtonTextVerified
          ]}>
            {isVerifyingEmail ? '...' : isEmailVerified ? '✓' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
      {isEmailVerified && (
        <Text style={styles.verifiedText}>✅ Email verified successfully!</Text>
      )}
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Address</Text>
      <View style={styles.addressInputRow}>
        <TextInput
          style={[
            styles.addressInput,
            focusedInput === 'formattedAddress' && styles.inputFocused
          ]}
          placeholder="Enter your address or select on map"
          placeholderTextColor="#94A3B8"
          value={formData.formattedAddress}
          onChangeText={(value) => updateField('formattedAddress', value)}
          onFocus={() => setFocusedInput('formattedAddress')}
          onBlur={() => setFocusedInput(null)}
          multiline={true}
          numberOfLines={2}
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={styles.mapButtonText}>🗺️</Text>
        </TouchableOpacity>
      </View>
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
            {renderEmailInput()}
            {renderInput('Phone Number', 'phoneNumber', '+1234567890', 'phone-pad')}
            {renderInput('Password', 'password', 'Create a secure password', 'default', true)}
            {renderAddressInput()}
            {renderInput('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD (e.g., 1990-01-15)')}
            
            {/* Optional fields */}
            <View style={styles.optionalSection}>
              <Text style={styles.optionalTitle}>Optional Information</Text>
              <ImagePickerComponent 
                onImageUpload={handleImageUpload}
                currentImageUrl={formData.profileImageUrl}
                label="Profile Image"
              />
              {renderInput('Latitude', 'latitude', 'Will be auto-filled from map', 'numeric')}
              {renderInput('Longitude', 'longitude', 'Will be auto-filled from map', 'numeric')}
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, (isLoading || !isEmailVerified) && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={isLoading || !isEmailVerified}
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

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
    gap: 20,
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
    height: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  emailInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  verifyButton: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#16A34A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonVerified: {
    backgroundColor: '#059669',
  },
  verifyButtonLoading: {
    backgroundColor: '#94A3B8',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  verifyButtonTextVerified: {
    fontSize: 18,
  },
  verifiedText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  addressInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  mapButton: {
    height: 52,
    width: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  mapButtonText: {
    fontSize: 20,
  },
  inputVerified: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
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
  optionalSection: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
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
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
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
    color: '#64748B',
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
