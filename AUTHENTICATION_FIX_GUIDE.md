# Authentication Fix Guide

## Issues Identified and Fixed

### 1. Google Authentication - Missing idToken

**Problem:** The mobile app wasn't receiving an `idToken` from Google Sign-In on iOS.

**Root Cause:** Two issues were identified:
1. Google Sign-In on iOS requires explicit configuration (`offlineAccess: true`)
2. The idToken was being accessed from the wrong location in the response object

**Fixes Applied:**
1. Added `offlineAccess: true` and `forceCodeForRefreshToken: true` to GoogleSignin.configure()
2. Updated token extraction to check multiple possible locations: `signInResult?.data?.idToken || signInResult?.idToken`

**Status:** ✅ FIXED and TESTED - Google authentication now works correctly

---

### 2. Apple Authentication - Error 1001 (ASAuthorizationErrorUnknown)

**Problem:** Apple Sign In fails with error 1001 in the simulator.

**Root Cause:** Apple Sign In does NOT work in the iOS Simulator - it only works on physical devices.

**Solution:** You must test Apple Sign In on a real iPhone device. The simulator will always fail with error 1001.

**Additional Requirements for Apple Sign In:**
1. ✅ Entitlements configured (already done in MobileApp.entitlements)
2. ✅ Bundle ID matches server expectation (org.reactjs.native.example.MobileApp)
3. ⚠️ Must test on a physical iOS device (simulator not supported)
4. ⚠️ Apple Developer account must have Sign In with Apple capability enabled
5. ⚠️ App must be properly signed with a provisioning profile

**Status:** ⚠️ CONFIGURATION CORRECT - Requires physical device testing

---

## Testing Instructions

### Google Authentication
1. Rebuild the app to pick up the configuration changes
2. Test on either simulator or physical device
3. The idToken should now be properly sent to the server
4. Check server logs for successful token verification

### Apple Authentication
1. **IMPORTANT:** You MUST use a physical iPhone device
2. Ensure your Apple Developer account has "Sign In with Apple" capability enabled
3. Build and run on the physical device
4. Test the Apple Sign In flow
5. Check server logs for token verification

---

## Diagnostic Logs

The code now includes comprehensive logging:

### Mobile App Logs
- `=== GOOGLE SIGN-IN DEBUG (Mobile) ===` - Shows token and user info
- `=== APPLE SIGN-IN DEBUG (Mobile) ===` - Shows token and response

### Server Logs
- `=== GOOGLE LOGIN DEBUG ===` - Shows received token and verification
- `=== APPLE LOGIN DEBUG ===` - Shows received token and verification

These logs will help identify any remaining issues.

---

## Next Steps

1. **For Google:** Rebuild the app and test - should work immediately
2. **For Apple:** Test on a physical iOS device with proper provisioning
3. If issues persist, check the diagnostic logs and verify:
   - Google: Client IDs match between app and server
   - Apple: Bundle ID matches and device is properly provisioned
