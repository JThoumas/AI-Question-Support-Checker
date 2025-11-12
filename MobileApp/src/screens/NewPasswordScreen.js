import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import API_BASE_URL from '../config/api'; // Import our API URL

const logoIcon = require('../assets/images/icon.png');

const NewPasswordScreen = ({ route, navigation }) => {
  const { email, code } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          code: code,
          newPassword: password,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // Success! Password is reset.
        Alert.alert(
          'Success!',
          'Your password has been updated. Please log in.'
        );
        // Go all the way back to the Login screen
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Reset Password Error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={logoIcon} style={styles.logo} />
      <Text style={styles.title}>Set a new password</Text>
      <Text style={styles.subtitle}>
        Create a new password. Ensure it differs from previous passwords.
      </Text>

      <View style={styles.formContainer}>
        <StyledTextInput
          placeholder="Enter your new password"
          value={password}
          onChangeText={setPassword}
          isPassword={true}
          autoCapitalize="none"
        />
        <StyledTextInput
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword={true}
          autoCapitalE="none"
        />

        <StyledButton
          title={loading ? <ActivityIndicator color="#fff" /> : 'Update Password'}
          onPress={handleUpdatePassword}
          styleType="primary"
          disabled={loading}
        />
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
});

export default NewPasswordScreen;