# Quick Fix: Rebuild APK with Notification Fixes

## What Was Fixed

1. ✅ Added Android notification permissions (`POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`)
2. ✅ Added notification channel configuration for Android 8.0+
3. ✅ Enabled cleartext traffic for HTTP notification service (temporary fix)
4. ✅ Added notification initialization in App.tsx
5. ✅ Added user alerts when notification permission is denied

## Rebuild Your APK

### Step 1: Clean and Rebuild
```powershell
# Clear Expo cache
npx expo start --clear

# Build new APK
eas build --platform android --profile preview
```

### Step 2: Install and Test
Once the build completes:
1. Download the APK from Expo dashboard
2. Install on your Android device
3. Grant notification permission when prompted
4. Test notifications

## Testing the Fix

### Test 1: Permission Check
- Open the app
- You should see notification permission request
- Grant the permission
- Check Settings > Apps > ShopMind > Notifications (should be enabled)

### Test 2: WebSocket Connection
- Log in to the app
- Check if WebSocket connects to notification service
- Look for connection logs

### Test 3: Receive Notifications
- Trigger a notification from your backend
- App should:
  - Show notification banner (when app is open)
  - Play sound
  - Vibrate
  - Show in notification tray (when app is in background)

## If Notifications Still Don't Work

### Check 1: Notification Permission
```powershell
adb shell dumpsys package com.kasun333.ShopMind | findstr "NOTIFICATION"
```
Should show: `android.permission.POST_NOTIFICATIONS: granted=true`

### Check 2: Network Connectivity
```powershell
# Check if device can reach notification service
adb shell ping -c 4 34.136.119.127

# Check WebSocket port
adb shell netstat | findstr "8087"
```

### Check 3: App Logs
```powershell
# View notification-related logs
adb logcat | findstr /i "notification websocket stomp"
```

Look for:
- ✅ "Notification permissions: granted"
- ✅ "Android notification channels configured"
- ✅ "Connected to WebSocket notifications"
- ❌ Any error messages

### Check 4: Battery Optimization
Some Android devices kill background processes. To test:

1. Settings > Apps > ShopMind > Battery
2. Set to "Unrestricted"
3. Test again

## Critical Next Step: HTTPS Migration

**The HTTP notification service will continue to cause issues on some devices.**

Update your notification service to use HTTPS:

1. Get an SSL certificate (Let's Encrypt is free)
2. Configure your backend for HTTPS on port 443
3. Update `src/config/apiConfig.ts`:

```typescript
NOTIFICATION_SERVICE: {
  PORT: '443',
  BASE_URL: 'https://your-domain.com',
  WS_URL: 'wss://your-domain.com/ws',
  HOSTED: true,
}
```

4. Remove `usesCleartextTraffic: true` from `app.json`
5. Rebuild APK

## Common Build Errors

### Error: "Failed to build APK"
- Check `eas.json` configuration
- Ensure all dependencies are installed
- Try: `npx expo install --check`

### Error: "Invalid permissions"
- The permissions in `app.json` are correct
- Rebuild with: `eas build --clear-cache --platform android`

### Error: "Stripe initialization failed"
- This is unrelated to notifications
- Ensure Stripe key is valid
- Check network connectivity

## Support

If you still face issues after following these steps:

1. Check full logs with: `adb logcat > logfile.txt`
2. Review `NOTIFICATION_FIX_GUIDE.md` for detailed troubleshooting
3. Test on multiple Android devices (different versions)
4. Verify your notification backend is accessible from external network

---

**Last Updated:** October 13, 2025
