# Notification Fix Guide for Production APK

## Problem Summary
Notifications work in Expo Go but fail in the production APK build.

## Root Causes Identified

### 1. **Missing Android Permissions** ✅ FIXED
- Added `POST_NOTIFICATIONS` permission (required for Android 13+)
- Added `RECEIVE_BOOT_COMPLETED` for persistent notifications
- Added `VIBRATE` permission

### 2. **HTTP Cleartext Traffic** ⚠️ NEEDS ATTENTION
Your notification service uses HTTP: `http://34.136.119.127:8087`

**Android 9+ blocks HTTP traffic by default in production builds.**

**Solutions:**
- **Option A (Recommended):** Use HTTPS for your notification service
- **Option B (Temporary):** Added `usesCleartextTraffic: true` in `app.json` (NOT recommended for production)

### 3. **Missing Notification Channels** ✅ FIXED
Android 8.0+ requires notification channels. Added:
- `default` - General notifications (MAX importance)
- `orders` - Order-related notifications (HIGH importance)
- `alerts` - Critical alerts (MAX importance)

### 4. **No Push Notification Token Registration** ⚠️ NEEDS IMPLEMENTATION
Currently using only WebSocket notifications. These won't work when:
- App is completely closed
- App is in background for extended periods
- Device is in doze mode

## Changes Made

### 1. Updated `app.json`
```json
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "RECEIVE_BOOT_COMPLETED",
    "VIBRATE",
    "POST_NOTIFICATIONS"
  ],
  "usesCleartextTraffic": true
}
```

### 2. Updated `inAppNotificationService.ts`
- Added Android notification channel setup
- Added channel-specific notification routing
- Added permission alert when denied

## Required Actions

### CRITICAL: Fix HTTP Connection Issue

#### Option 1: Enable HTTPS (RECOMMENDED)
Update your notification service backend to support HTTPS, then update `apiConfig.ts`:

```typescript
NOTIFICATION_SERVICE: {
  PORT: '8087',
  BASE_URL: 'https://your-domain.com:8087',  // Change to HTTPS
  WS_URL: 'wss://your-domain.com:8087/ws',   // Change to WSS
  HOSTED: true,
}
```

#### Option 2: Keep HTTP (NOT RECOMMENDED FOR PRODUCTION)
The `usesCleartextTraffic: true` flag has been added temporarily, but this:
- Reduces security
- May not work on all Android versions
- Is flagged by Play Store security scans

### Additional Recommendations

#### 1. Test Notification Permissions
After building the APK, ensure:
```bash
# Build new APK with fixes
eas build --platform android --profile preview

# Install and test
adb install your-app.apk

# Check notification permission status
adb shell dumpsys notification_listener
```

#### 2. Add Push Notifications for Background Support
For notifications when app is closed, integrate Firebase Cloud Messaging:

```bash
npx expo install expo-notifications firebase
```

Then register for push tokens in your notification service.

#### 3. Test Network Connectivity
When testing the APK, verify WebSocket connection:
- Check logs with `adb logcat | grep -i notification`
- Ensure device can reach `34.136.119.127:8087`
- Test on mobile data (not just WiFi)

#### 4. Handle Android Battery Optimization
Some devices kill background processes. Add to `app.json`:

```json
"android": {
  "intentFilters": [
    {
      "action": "android.intent.action.BOOT_COMPLETED"
    }
  ]
}
```

## Testing Checklist

Before releasing to production:

- [ ] App requests notification permission on first launch
- [ ] Notifications appear when app is in foreground
- [ ] Notifications appear when app is in background
- [ ] Notifications appear when app is completely closed
- [ ] WebSocket connection establishes successfully
- [ ] Sound and vibration work correctly
- [ ] Notification icons appear in status bar
- [ ] Tapping notifications opens the app
- [ ] Badge count updates correctly
- [ ] Works on mobile data (not just WiFi)
- [ ] Tested on Android 9, 10, 11, 12, 13+
- [ ] Battery optimization doesn't kill notifications

## Common Issues & Solutions

### Issue: "No notifications received in APK"
**Solution:** 
1. Check if notification permission was granted
2. Verify WebSocket connects (check logs)
3. Test HTTP connectivity to notification service
4. Ensure device isn't in battery saver mode

### Issue: "WebSocket fails to connect"
**Solution:**
1. Switch to HTTPS/WSS
2. Check firewall/network policies
3. Verify notification service is accessible from external network
4. Test with `curl http://34.136.119.127:8087` from device

### Issue: "Notifications work but no sound"
**Solution:**
1. Check notification channel settings
2. Verify device isn't on silent mode
3. Check app notification settings in device settings
4. Test with `adb shell cmd notification post -S bigtext -t 'Test' 'Tag' 'Test notification'`

### Issue: "App killed by system, no notifications"
**Solution:**
1. Implement Firebase Cloud Messaging for push notifications
2. Add foreground service for persistent connection (for specific use cases)
3. Handle `BOOT_COMPLETED` intent to reconnect after device restart

## Next Steps

1. **Immediate:** Rebuild APK with current fixes
   ```bash
   eas build --platform android --profile preview
   ```

2. **Short-term:** Migrate notification service to HTTPS

3. **Long-term:** Implement FCM push notifications for background delivery

4. **Testing:** Test thoroughly on multiple Android versions and devices

## Debugging Commands

```bash
# View logs from device
adb logcat | grep -i "notification\|websocket\|stomp"

# Check notification settings
adb shell dumpsys notification

# Test notification manually
adb shell cmd notification post -S bigtext -t 'Test Title' 'tag1' 'Test Body'

# Check app permissions
adb shell dumpsys package com.kasun333.ShopMind | grep permission

# View network connections
adb shell netstat | grep 8087
```

## Support Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Notification Channels](https://developer.android.com/training/notify-user/channels)
- [WebSocket over HTTP vs HTTPS](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)

---

**Last Updated:** October 13, 2025
**Status:** Partial fixes applied, HTTPS migration required for full production readiness
