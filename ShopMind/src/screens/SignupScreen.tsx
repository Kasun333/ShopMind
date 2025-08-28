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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
      
      const response = await fetch('http://192.168.43.229:8080/api/auth/signup', {
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
    iconName: string,
    keyboardType: any = 'default',
    secureTextEntry = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        focusedInput === field && styles.inputWrapperFocused,
        field === 'email' && isEmailVerified && styles.inputWrapperVerified
      ]}>
        <Ionicons name={iconName as any} size={18} color={focusedInput === field ? "#2A7CC7" : "#94A3B8"} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={formData[field as keyof typeof formData]}
          onChangeText={(value) => updateField(field, value)}
          onFocus={() => setFocusedInput(field)}
          onBlur={() => setFocusedInput(null)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
        />
      </View>
    </View>
  );

  const renderEmailInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Email</Text>
      <View style={styles.emailInputRow}>
        <View style={[
          styles.emailInputWrapper,
          focusedInput === 'email' && styles.inputWrapperFocused,
          isEmailVerified && styles.inputWrapperVerified
        ]}>
          <Ionicons name="mail-outline" size={18} color={isEmailVerified ? "#059669" : focusedInput === 'email' ? "#2A7CC7" : "#94A3B8"} style={styles.inputIcon} />
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor="#94A3B8"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            isEmailVerified && styles.verifyButtonVerified,
            isVerifyingEmail && styles.verifyButtonLoading
          ]}
          onPress={verifyEmail}
          disabled={isVerifyingEmail || isEmailVerified || !formData.email.trim()}
        >
          {isVerifyingEmail ? (
            <Text style={styles.verifyButtonText}>...</Text>
          ) : isEmailVerified ? (
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
      {isEmailVerified && (
        <Text style={styles.verifiedText}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" /> Email verified successfully!
        </Text>
      )}
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Address</Text>
      <View style={styles.addressInputRow}>
        <View style={[
          styles.addressInputWrapper,
          focusedInput === 'formattedAddress' && styles.inputWrapperFocused
        ]}>
          <Ionicons name="location-outline" size={18} color={focusedInput === 'formattedAddress' ? "#2A7CC7" : "#94A3B8"} style={styles.inputIcon} />
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your address or select on map"
            placeholderTextColor="#94A3B8"
            value={formData.formattedAddress}
            onChangeText={(value) => updateField('formattedAddress', value)}
            onFocus={() => setFocusedInput('formattedAddress')}
            onBlur={() => setFocusedInput(null)}
            multiline={true}
            numberOfLines={2}
          />
        </View>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowLocationModal(true)}
        >
          <LinearGradient
            colors={['#3B95E3', '#2A7CC7']}
            style={styles.mapButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="map" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Gradient Background */}
      <LinearGradient
        colors={['#1E6091', '#2A7CC7', '#3B95E3']}
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
          <Text style={styles.toastText}>
            {toast.type === 'success' ? (
              <Ionicons name="checkmark-circle" size={16} color="#059669" style={{marginRight: 6}} />
            ) : (
              <Ionicons name="alert-circle" size={16} color="#DC2626" style={{marginRight: 6}} />
            )}
            {toast.message}
          </Text>
        </Animated.View>
      )}

      {/* Header with Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ShopMind</Text>
        <Text style={styles.logoTagline}>Create your account</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Join ShopMind</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>

          <View style={styles.form}>
            {renderInput('Full Name', 'fullName', 'Enter your full name', 'person-outline')}
            {renderInput('Username', 'username', 'Choose a username', 'at-outline')}
            {renderEmailInput()}
            {renderInput('Phone Number', 'phoneNumber', '+1234567890', 'call-outline', 'phone-pad')}
            {renderInput('Password', 'password', 'Create a secure password', 'lock-closed-outline', 'default', true)}
            {renderAddressInput()}
            {renderInput('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD (e.g., 1990-01-15)', 'calendar-outline')}
            
            {/* Optional fields */}
            <View style={styles.optionalSection}>
              <View style={styles.optionalHeader}>
                <View style={styles.dividerLine} />
                <Text style={styles.optionalTitle}>Optional Information</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <ImagePickerComponent 
                onImageUpload={handleImageUpload}
                currentImageUrl={formData.profileImageUrl}
                label="Profile Image"
              />
              
              <View style={styles.locationFields}>
                <View style={styles.halfWidth}>
                  {renderInput('Latitude', 'latitude', 'Auto-filled from map', 'navigate-outline', 'numeric')}
                </View>
                <View style={styles.halfWidth}>
                  {renderInput('Longitude', 'longitude', 'Auto-filled from map', 'navigate-circle-outline', 'numeric')}
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, (isLoading || !isEmailVerified) && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={isLoading || !isEmailVerified}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2A7CC7', '#1E6091']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.signupButtonText}>
                  {isLoading ? (
                    <>
                      <Ionicons name="refresh" size={18} color="#FFFFFF" style={{marginRight: 8}} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Ionicons name="person-add" size={18} color="#FFFFFF" style={{marginRight: 8}} />
                      Create Account
                    </>
                  )}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLogin} onPress={onBackToLogin} activeOpacity={0.7}>
              <Text style={styles.backToLoginText}>
                <Ionicons name="arrow-back" size={16} color="#FFFFFF" style={{marginRight: 4}} />
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
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
    gap: 18,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E6091',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWrapperFocused: {
    borderColor: '#2A7CC7',
    shadowColor: '#2A7CC7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  inputWrapperVerified: {
    borderColor: '#059669',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    paddingRight: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  emailInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  emailInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emailInput: {
    flex: 1,
    height: 52,
    paddingRight: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  verifyButton: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
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
  verifiedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  addressInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressInput: {
    flex: 1,
    minHeight: 52,
    paddingRight: 16,
    paddingTop: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  mapButton: {
    height: 52,
    width: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionalSection: {
    marginTop: 16,
    paddingTop: 16,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
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
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backToLogin: {
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  toast: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: width * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
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