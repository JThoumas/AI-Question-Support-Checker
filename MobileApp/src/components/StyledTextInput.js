import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const StyledTextInput = ({ placeholder, isPassword = false, value, onChangeText }) => {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={isSecure} 
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      {/* --- 4. ADD THE PRESSABLE ICON --- */}
      {isPassword && (
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Icon 
            name={isSecure ? 'eye-off' : 'eye'} 
            size={20} 
            color="#888" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
});

export default StyledTextInput;