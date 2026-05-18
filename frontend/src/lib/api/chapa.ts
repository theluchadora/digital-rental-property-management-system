import apiClient from "@/lib/api-client";

export const chapaApi = {
  initializePayment: async (params: any) => {
    const response = await apiClient.post("/api/payments/initialize", params);
    return response.data;
  },

  verifyTransaction: async (txRef: string) => {
    const response = await apiClient.get(`/api/payments/verify/${txRef}`);
    return {
      status: response.data.status === 'paid' ? 'success' : 'failed',
      data: response.data,
    };
  },
};