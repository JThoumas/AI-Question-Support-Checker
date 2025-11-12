import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledTextInput from '../components/StyledTextInput';
import API_BASE_URL from '../config/api';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context'; // Correct import

const logoIcon = require('../assets/images/icon.png');

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password: password,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        Alert.alert(
          'Success!',
          'Your account has been created. Please log in.',
        );
        navigation.navigate('Login');
      } else {
        Alert.alert('Sign-up Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Signup API Error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    // Use the correct SafeAreaView import
    <SafeAreaViewContext style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={logoIcon} style={styles.logo} />
      <Text style={styles.title}>Sign up</Text>

      <View style={styles.formContainer}>
        {/* Social Buttons */}
        <StyledButton
          title="Continue with Google"
          onPress={() => console.log('Google Sign-in')}
          styleType="secondary"
        />
        <StyledButton
          title="Continue with Apple"
          onPress={() => console.log('Apple Sign-in')}
          styleType="secondary"
        />

        <Text style={styles.orText}>or</Text>

        {/* Form Inputs */}
        <StyledTextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <StyledTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <StyledTextInput
          placeholder="Password"
          isPassword={true}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <StyledTextInput
          placeholder="Confirm Password"
          isPassword={true}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        {/* Main Signup Button */}
        <StyledButton
          title={loading ? <ActivityIndicator color="#fff" /> : 'Continue'}
          onPress={handleSignUp}
          styleType="primary"
          disabled={loading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaViewContext>
  );
};

// --- Your Styles (They are correct!) ---
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
    marginBottom: 20,
  },
  formContainer: {
    width: '85%',
  },
  orText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
  signInText: {
    fontSize: 14,
    color: '#3A4B8E',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;