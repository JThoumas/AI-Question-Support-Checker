import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const StyledButton = ({
  title,
  onPress,
  styleType = 'primary',
  iconName,
  iconSet = 'AntDesign',
  iconColor = '#000'
}) => {
  // Select the appropriate icon component based on iconSet
  const IconComponent = iconSet === 'Feather' ? Feather :
                       iconSet === 'MaterialIcons' ? MaterialIcons :
                       iconSet === 'FontAwesome' ? FontAwesome :
                       AntDesign;
  const containerStyle = [
    styles.container,
    styleType === 'primary' ? styles.primaryContainer : styles.secondaryContainer,
  ];
  const textStyle = [
    styles.text,
    styleType === 'primary' ? styles.primaryText : styles.secondaryText,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={containerStyle}>
      {iconName && (
        <IconComponent
          name={iconName}
          size={20}
          color={styleType === 'primary' ? '#FFF' : iconColor}
          style={styles.icon}
        />
      )}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- Your styles are all correct ---
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  primaryContainer: {
    backgroundColor: '#3A4B8E',
  },
  secondaryContainer: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  icon: {
    marginRight: 10,
  },
});

export default StyledButton;