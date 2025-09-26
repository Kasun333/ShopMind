import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore
import { EMAIL_VERIFIER_API_KEY } from '@env';
import LocationPickerModal from '../components/LocationPickerModal';
import ImagePickerComponent from '../components/ImagePickerComponent';
import { AuthService } from '../services/authService';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

type FormDataType = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  profileImageUrl: string;
  latitude: string;
  longitude: string;
  formattedAddress: string;
  dateOfBirth: string;
};

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState<FormDataType>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    profileImageUrl: '',
    latitude: '',
    longitude: '',
    formattedAddress: '',
    dateOfBirth: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const verifyEmail = async () => {
    const email = formData.email.trim();
    
    if (!email) {
      showAlert('Error', 'Please enter an email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const isValid = await AuthService.validateEmail(email);
      
      if (isValid) {
        setIsEmailVerified(true);
        showAlert('Success', 'Email verified successfully!');
      } else {
        setIsEmailVerified(false);
        showAlert('Error', 'This email does not appear to exist or is not deliverable');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      showAlert('Error', 'Failed to verify email. Please try again.');
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
    showAlert('Success', 'Location selected successfully!');
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      profileImageUrl: imageUrl,
    }));
    showAlert('Success', 'Profile image uploaded successfully!');
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword, fullName, phoneNumber, formattedAddress, dateOfBirth } = formData;
    
    // Full name validation
    if (!fullName.trim()) {
      showAlert('Error', 'Full name is required');
      return false;
    }
    if (fullName.trim().length < 2) {
      showAlert('Error', 'Full name must be at least 2 characters');
      return false;
    }
    
    // Username validation
    if (!username.trim()) {
      showAlert('Error', 'Username is required');
      return false;
    }
    if (username.trim().length < 3) {
      showAlert('Error', 'Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      showAlert('Error', 'Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Email validation
    if (!email.trim()) {
      showAlert('Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!isEmailVerified) {
      showAlert('Error', 'Please verify your email address first');
      return false;
    }
    
    // Phone number validation
    if (!phoneNumber.trim()) {
      showAlert('Error', 'Phone number is required');
      return false;
    }
    const phoneRegex = /^07[0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      showAlert('Error', 'Please enter a valid phone number (e.g., 0718247980)');
      return false;
    }
    
    // Password validation
    if (!password.trim()) {
      showAlert('Error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showAlert('Error', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    
    // Confirm password validation
    if (!confirmPassword.trim()) {
      showAlert('Error', 'Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return false;
    }
    
    // Address validation
    if (!formattedAddress.trim()) {
      showAlert('Error', 'Address is required');
      return false;
    }
    if (formattedAddress.trim().length < 10) {
      showAlert('Error', 'Please enter a complete address');
      return false;
    }
    
    // Date of birth validation
    if (!dateOfBirth.trim()) {
      showAlert('Error', 'Date of birth is required');
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth.trim())) {
      showAlert('Error', 'Date of birth must be in YYYY-MM-DD format');
      return false;
    }
    const birthDate = new Date(dateOfBirth.trim());
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13 || age > 120) {
      showAlert('Error', 'You must be between 13 and 120 years old');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const signupData = {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        role: "Customer", // Default role for now
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        profileImageUrl: formData.profileImageUrl,
      };
      
      const result = await AuthService.signup(signupData);
      
      if (result.success) {
        showAlert('Success', 'Account created successfully! Please login.');
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      } else {
        showAlert('Error', result.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showAlert('Error', 'Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormDataType,
    placeholder: string,
    iconName: keyof typeof Ionicons.glyphMap,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={iconName} size={20} color="#3B82F6" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={formData[field]}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [field]: text }));
            if (field === 'email') setIsEmailVerified(false);
          }}
          keyboardType={keyboardType}
          autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const renderPasswordInput = (
    label: string,
    field: keyof FormDataType,
    placeholder: string,
    isVisible: boolean,
    toggleVisibility: () => void
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed" size={20} color="#3B82F6" style={styles.inputIcon} />
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={formData[field]}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [field]: text }));
          }}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={toggleVisibility}
        >
          <Ionicons 
            name={isVisible ? 'eye-off' : 'eye'} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmailInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Email</Text>
      <View style={styles.emailRow}>
        <View style={[styles.inputWrapper, styles.emailInputWrapper, isEmailVerified && styles.inputWrapperVerified]}>
          <Ionicons name="mail" size={20} color={isEmailVerified ? "#10B981" : "#3B82F6"} style={styles.inputIcon} />
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, email: text }));
              setIsEmailVerified(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.verifyButton, isEmailVerified && styles.verifyButtonVerified]}
          onPress={verifyEmail}
          disabled={isVerifyingEmail || isEmailVerified || !formData.email.trim()}
        >
          {isVerifyingEmail ? (
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          ) : isEmailVerified ? (
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
      {isEmailVerified && (
        <View style={styles.verifiedContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.verifiedText}>Email verified successfully!</Text>
        </View>
      )}
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Address</Text>
      <View style={styles.addressRow}>
        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your address or select on map"
            placeholderTextColor="#9CA3AF"
            value={formData.formattedAddress}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, formattedAddress: text }));
            }}
            multiline={true}
            numberOfLines={2}
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="map" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>
        </View>

        <View style={styles.form}>
          {renderInput('Full Name', 'fullName', 'Enter your full name', 'person')}
          {renderInput('Username', 'username', 'Choose a username', 'at')}
          {renderEmailInput()}
          {renderInput('Phone Number', 'phoneNumber', '+1234567890', 'call', 'phone-pad')}
          {renderPasswordInput('Password', 'password', 'Create a secure password', showPassword, () => setShowPassword(!showPassword))}
          {renderPasswordInput('Confirm Password', 'confirmPassword', 'Confirm your password', showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
          {renderAddressInput()}
          {renderInput('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD (e.g., 1990-01-15)', 'calendar')}
          
          {/* Optional fields */}
          <View style={styles.optionalSection}>
            <Text style={styles.optionalTitle}>Optional Information</Text>
            
            <ImagePickerComponent 
              onImageUpload={handleImageUpload}
              currentImageUrl={formData.profileImageUrl}
              label="Profile Image"
            />
            
            <View style={styles.locationFields}>
              <View style={styles.halfWidth}>
                {renderInput('Latitude', 'latitude', 'Auto-filled from map', 'navigate')}
              </View>
              <View style={styles.halfWidth}>
                {renderInput('Longitude', 'longitude', 'Auto-filled from map', 'navigate')}
              </View>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
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
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperVerified: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  emailRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emailInputWrapper: {
    flex: 1,
  },
  emailInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  verifyButton: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonVerified: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
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
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionalSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  signupButton: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backToLogin: {
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '400',
  },
  loginLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});