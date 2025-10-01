// @ts-ignore
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    console.log('Starting Cloudinary upload for:', imageUri);

    // Create FormData for upload
    const formData = new FormData();
    
    // Add the image file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile-image.jpg',
    } as any);
    
    // Add upload parameters (only these are needed for unsigned uploads)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    console.log('Uploading to Cloudinary URL:', cloudinaryUrl);

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Cloudinary response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      
      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Upload failed: ${errorJson.error?.message || response.status}`);
      } catch (parseError) {
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
    }

    const result: CloudinaryUploadResult = await response.json();
    console.log('Cloudinary upload successful:', result.secure_url);

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Note: Deletion requires signed requests with API secret
    // For security, this should typically be done from your backend
    console.log('Image deletion should be handled by backend for security');
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const testCloudinaryConfig = () => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  }
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('CLOUDINARY_UPLOAD_PRESET is not configured');
  }
  
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET
  };
};
