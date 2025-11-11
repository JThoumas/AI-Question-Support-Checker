import { Platform } from 'react-native';

// Define the base URLs
const API_URL_IOS = 'http://localhost:3001/api/auth';
const API_URL_ANDROID = 'http://10.0.2.2:3001/api/auth';

// Select the correct URL based on the platform
const API_BASE_URL = Platform.OS === 'ios' ? API_URL_IOS : API_URL_ANDROID;

export default API_BASE_URL;