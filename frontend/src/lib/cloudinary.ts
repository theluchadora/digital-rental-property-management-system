// lib/cloudinary.ts

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (
  file: File, 
  folder: string
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is not configured");
  }
  
  if (!UPLOAD_PRESET) {
    throw new Error("Cloudinary upload preset is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder); 
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Cloudinary error details:", data);
      throw new Error(data.error?.message || "Upload failed");
    }
    
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Convenience functions for different use cases
export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  return uploadImage(file, `users/${userId}`);
};

export const uploadPropertyImage = async (
  file: File, 
  propertyId: string, 
  isPrimary: boolean = false
): Promise<string> => {
  const folder = `properties/${propertyId}`;
  return uploadImage(file, folder);
};

export const uploadMaintenanceImage = async (
  file: File, 
  requestId: string
): Promise<string> => {
  return uploadImage(file, `maintenance/${requestId}`);
};

export const uploadMultiplePropertyImages = async (
  files: File[], 
  propertyId: string
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) => 
    uploadPropertyImage(file, propertyId, index === 0)
  );
  return Promise.all(uploadPromises);
};

export const uploadMultipleMaintenanceImages = async (
  files: File[], 
  requestId: string
): Promise<string[]> => {
  const uploadPromises = files.map(file => 
    uploadMaintenanceImage(file, requestId)
  );
  return Promise.all(uploadPromises);
};