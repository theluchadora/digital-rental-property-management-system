import axios from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data;
      
      if (data.error && typeof data.error === "string") {
        return data.error;
      }
      
      if (data.message && typeof data.message === "string") {
        return data.message;
      }
      
      const registrationError = data["Registration failed"];
      if (registrationError && typeof registrationError === "string") {
        return registrationError;
      }
      
      if (typeof data === "string") {
        return data;
      }
    }
    
    if (error.message === "Network Error") {
      return "Network error. Please check your connection.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
}