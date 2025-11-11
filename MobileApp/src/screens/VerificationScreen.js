import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledButton from '../components/StyledButton';
import API_BASE_URL from '../config/api';
// --- 1. IMPORT THE NEW COMPONENT ---
import OtpInput from 'react-native-otp-textinput';

const logoIcon = require('../assets/images/icon.png');

const VerificationScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        navigation.navigate('NewPassword', { email: email, code: code });
      } else {
        Alert.alert('Error', data.error || 'Invalid or expired code.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Verify Code Error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}>
        <StatusBar barStyle="dark-content" />
        <Image source={logoIcon} style={styles.logo} />
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6 digit code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.formContainer}>
          {/* --- 2. REPLACE THE OLD TEXT INPUT --- */}
          <OtpInput
            handleTextChange={setCode} // This is how it sets our 'code' state
            tintColor="#3A4B8E" // Sets the border/cursor color
            offTintColor="#E0E0E0" // Sets the inactive box color
            textInputStyle={styles.otpBox}
            containerStyle={styles.otpContainer}
            autoFocus={true} // Automatically focus the input
            keyboardType="number-pad"
            inputCount={6} // Make sure this matches your backend
          />
          {/* --- END REPLACEMENT --- */}

          <StyledButton
            title={loading ? <ActivityIndicator color="#fff" /> : 'Verify Code'}
            onPress={handleVerifyCode}
            styleType="primary"
            disabled={loading}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- 3. ADD THE NEW STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
    width: '85%',
  },
  emailText: {
    fontWeight: 'bold',
    color: '#000',
  },
  formContainer: {
    width: '90%', // Increased width slightly for the boxes
    alignItems: 'center', // Center the OTP boxes
  },
  // --- NEW STYLES FOR OTP INPUT ---
  otpContainer: {
    marginBottom: 30,
    width: '100%',
    paddingHorizontal: 10,
  },
  otpBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#F0F0F0',
    // Ensure the box is square
    width: 45,
    height: 55,
    textAlign: 'center',
  },
  // --- END NEW STYLES ---
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3A4B8E',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default VerificationScreen;