import { appConfig } from "@/lib/app-config";
import { authStorage } from "@/lib/auth-storage";

interface FileUploadResponse {
  fileName: string;
}

export const fileUploadService = {
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = authStorage.getAccessToken();
    const response = await fetch(`${appConfig.apiBaseUrl}/file-upload/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const data: FileUploadResponse = await response.json();
    return data.fileName;
  },

  uploadMultiple: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const token = authStorage.getAccessToken();
    const response = await fetch(`${appConfig.apiBaseUrl}/file-upload/upload/multiple`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const data: FileUploadResponse[] = await response.json();
    return data.map((item) => item.fileName);
  },

  getFileUrl: (fileName: string): string => {
    if (!fileName) return "";
    return `${appConfig.apiBaseUrl}/file-upload/${fileName}`;
  },

  getFile: async (fileName: string): Promise<Blob> => {
    const token = authStorage.getAccessToken();
    const response = await fetch(`${appConfig.apiBaseUrl}/file-upload/${fileName}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    return response.blob();
  },

  downloadFile: async (fileName: string): Promise<Blob> => {
    const token = authStorage.getAccessToken();
    const response = await fetch(`${appConfig.apiBaseUrl}/file-upload/download/${fileName}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    return response.blob();
  },

  uploadAndGetUrl: async (file: File): Promise<{ fileName: string; url: string }> => {
    const fileName = await fileUploadService.upload(file);
    return { fileName, url: fileUploadService.getFileUrl(fileName) };
  },
};
