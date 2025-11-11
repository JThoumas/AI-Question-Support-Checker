import React, { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import appleAuth, {
  AppleButton,
} from '@invertase/react-native-apple-authentication';

const logoIcon = require('../assets/images/icon.png');

GoogleSignin.configure({
  webClientId: '44508810515-stieegntlupj5b8gppb77fuiggcpq3tf.apps.googleusercontent.com',
  iosClientId: '44508810515-a9mh44lp3j2ajrmu7tovo50dv6g90dj4.apps.googleusercontent.com',
  offlineAccess: true, // Required to get idToken on iOS
  forceCodeForRefreshToken: true, // Ensures we get the token
});

const LoginScreen = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    console.log("=== GOOGLE SIGN-IN STARTED ===");
    try {
      console.log("Checking Play Services...");
      await GoogleSignin.hasPlayServices();
      console.log("Play Services OK, attempting sign in...");
      
      const signInResult = await GoogleSignin.signIn();
      console.log("Sign in successful, got result");
      
      // On iOS, idToken is in signInResult.data.idToken or signInResult.idToken
      // On Android, it might be in a different location
      const idToken = signInResult?.data?.idToken || signInResult?.idToken || null;

      console.log("=== GOOGLE SIGN-IN DEBUG (Mobile) ===");
      console.log("Full signInResult:", JSON.stringify(signInResult, null, 2));
      console.log("idToken from data:", signInResult?.data?.idToken ? 'PRESENT' : 'MISSING');
      console.log("idToken direct:", signInResult?.idToken ? 'PRESENT' : 'MISSING');
      console.log("Final idToken:", idToken ? `${idToken.substring(0, 50)}...` : 'MISSING');
      console.log("API URL:", `${API_BASE_URL}/google-login`);

      if (!idToken) {
        console.error("No idToken found in sign-in result!");
        Alert.alert('Error', 'Could not get authentication token from Google. Please try again.');
        return;
      }

      // Now send this token to our backend
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      setLoading(false);

      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token);
        navigation.replace('Home');
      } else {
        console.error("Google login failed:", data);
        Alert.alert('Google Login Failed', data.error || 'Something went wrong', [
          { text: 'OK', onPress: () => console.log('Error details:', data.details) }
        ]);
      }
      } catch (error) {
          setLoading(false);
          if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
            console.error('=== GOOGLE SIGN-IN ERROR (Mobile) ===');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            Alert.alert('Error', `Google Sign-in failed: ${error.message}`);
          }
      }
  };

  const handleAppleLogin = async () => {
  try {
    // 1. Request login from Apple
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    console.log("=== APPLE SIGN-IN DEBUG (Mobile) ===");
    console.log("Full response:", JSON.stringify(appleAuthRequestResponse, null, 2));

    const { identityToken, fullName } = appleAuthRequestResponse;
    console.log("identityToken:", identityToken ? `${identityToken.substring(0, 50)}...` : 'MISSING');
    console.log("fullName:", fullName);
    console.log("API URL:", `${API_BASE_URL}/apple-login`);

    if (identityToken) {
      // 2. Send the token to our backend
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/apple-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: identityToken,
          fullName: fullName,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      setLoading(false);

      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token);
        navigation.replace('Home');
      } else {
        console.error("Apple login failed:", data);
        Alert.alert('Apple Login Failed', data.error || 'Something went wrong', [
          { text: 'OK', onPress: () => console.log('Error details:', data.details) }
        ]);
      }
    } else {
      Alert.alert('Error', 'Could not get Apple token.');
    }
    } catch (error) {
      setLoading(false);
      if (error.code !== appleAuth.Error.CANCELLED) {
        console.error('=== APPLE SIGN-IN ERROR (Mobile) ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        Alert.alert('Error', `Apple Sign-in failed: ${error.message}`);
      }
    }
  };

  const handleLogin = async () => {
    if (!login || !password) {
      Alert.alert('Error', 'Please enter both username/email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: login.toLowerCase(),
          password: password,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token);
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Login API Error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };
  
  return (
    // Use the correct SafeAreaView import
    <SafeAreaViewContext style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={logoIcon} style={styles.logo} />
      <Text style={styles.title}>Log in</Text>

      <View style={styles.formContainer}>
        {/* Social Buttons */}
        <StyledButton
          title="Continue with Google"
          onPress={handleGoogleLogin}
          styleType="secondary"
          iconSet="FontAwesome"
          iconName="google"
        />
        {appleAuth.isSupported && ( // Only show button on supported devices (iOS)
          <AppleButton
            buttonStyle={AppleButton.Style.BLACK}
            buttonType={AppleButton.Type.SIGN_IN}
            style={styles.appleButton} // We'll add this style
            onPress={handleAppleLogin}
          />
        )}

        <Text style={styles.orText}>or</Text>

        {/* Form Inputs */}
        <StyledTextInput
          placeholder="Username or Email"
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
        />
        <StyledTextInput
          placeholder="Password"
          isPassword={true}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Main Login Button */}
        <StyledButton
          title={loading ? <ActivityIndicator color="#fff" /> : 'Continue'}
          onPress={handleLogin}
          styleType="primary"
          disabled={loading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaViewContext>
  );
};

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
  forgotText: {
    fontSize: 14,
    color: '#3A4B8E',
    textAlign: 'right',
    marginBottom: 20,
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
  signUpText: {
    fontSize: 14,
    color: '#3A4B8E',
    fontWeight: 'bold',
  },
  appleButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    marginVertical: 8,
  },
});

export default LoginScreen;