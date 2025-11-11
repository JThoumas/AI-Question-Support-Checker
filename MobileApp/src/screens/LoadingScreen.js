import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logoIcon = require('../assets/images/icon.png'); 

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // After 2 seconds, navigate to the Login screen
      navigation.replace('Login'); 
    }, 2000); // 2000ms = 2 seconds

    // Clear the timer if the component is unmounted
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Set the status bar text to light for this dark screen */}
      <StatusBar barStyle="light-content" />
      <Image source={logoIcon} style={styles.logo} />
      <Text style={styles.title}>AI Question Support Checker</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A4B8E',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default LoadingScreen;