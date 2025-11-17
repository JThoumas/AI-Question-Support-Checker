import { Platform } from 'react-native';

// Existing auth URLs (DO NOT CHANGE)
const AUTH_URL_IOS = 'http://localhost:3001/api/auth';
const AUTH_URL_ANDROID = 'http://10.0.2.2:3001/api/auth';

const AUTH_API = Platform.OS === 'ios' ? AUTH_URL_IOS : AUTH_URL_ANDROID;

// ADD NEW URLS BELOW

// AI endpoint
const AI_URL_IOS = 'http://localhost:3001/api/generate-answer';
const AI_URL_ANDROID = 'http://10.0.2.2:3001/api/generate-answer';

const AI_API = Platform.OS === 'ios' ? AI_URL_IOS : AI_URL_ANDROID;

// Mock JSON server for posts/comments (port 3005)
const JSON_URL_IOS = 'http://localhost:3005';
const JSON_URL_ANDROID = 'http://10.0.2.2:3005';

const JSON_SERVER_API = Platform.OS === 'ios' ? JSON_URL_IOS : JSON_URL_ANDROID;

export { AUTH_API, AI_API, JSON_SERVER_API };
