# Cloudinary Setup Guide for ShopMind

## 1. Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Credentials
After logging in to your Cloudinary dashboard:
1. Go to the Dashboard (https://cloudinary.com/console)
2. You'll see your account details:
   - Cloud Name
   - API Key
   - API Secret (click "Reveal" to see it)

## 3. Create an Upload Preset
1. Go to Settings > Upload (https://cloudinary.com/console/settings/upload)
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure your preset:
   - **Preset name**: `shopmind_profiles` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (important for mobile uploads)
   - **Folder**: `shopmind/profiles` (optional, helps organize images)
   - **Use filename or externally defined Public ID**: Unchecked
   - **Unique filename**: Checked
   - **Overwrite**: Unchecked
5. Under "Image and video transformations":
   - **Format**: `Auto`
   - **Quality**: `Auto`
   - **Resize**: `Fill`, Width: `300`, Height: `300`
6. Click "Save"

## 4. Update Your .env File
Replace the placeholder values in your .env file with your actual credentials:

```
EMAIL_VERIFIER_API_KEY=c30cbd8e6e674d8d926df21f80918395

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
CLOUDINARY_UPLOAD_PRESET=shopmind_profiles
```

## 5. Security Note
- The API Secret should never be exposed in mobile apps
- We only use Cloud Name, API Key, and Upload Preset in the mobile app
- Upload Preset must be "unsigned" for direct uploads from mobile
- For additional security, you can set up allowed domains in Cloudinary settings

## 6. Testing
1. Restart your Expo development server
2. Try uploading an image in the signup form
3. Check your Cloudinary Media Library to see uploaded images

## 7. Optional: Configure Transformations
You can add automatic transformations to your upload preset:
- Face detection and cropping
- Format optimization (WebP, AVIF)
- Quality optimization
- Watermarks
- And much more!

## Pricing
- Free tier: 25 GB storage, 25 GB bandwidth per month
- Paid plans available for higher usage
- Perfect for development and small to medium apps
