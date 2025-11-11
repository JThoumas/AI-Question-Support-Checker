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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import API_BASE_URL from '../config/api'; // Import our API URL

const logoIcon = require('../assets/images/icon.png');

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // Success! Navigate to the verification screen
        Alert.alert(
          'Check Your Email',
          data.message || 'If an account with that email exists, a code was sent.'
        );
        navigation.navigate('Verification', { email: email.toLowerCase() });
      } else {
        Alert.alert('Error', data.error || 'Something went wrong.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Forgot Password Error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={logoIcon} style={styles.logo} />
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>
        Please enter your email to reset your password
      </Text>

      <View style={styles.formContainer}>
        <StyledTextInput
          placeholder="Your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <StyledButton
          title={loading ? <ActivityIndicator color="#fff" /> : 'Reset Password'}
          onPress={handleResetPassword}
          styleType="primary"
          disabled={loading}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Add your styles from Day 12 below ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  formContainer: {
    width: '85%',
  },
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

export default ForgotPasswordScreen;