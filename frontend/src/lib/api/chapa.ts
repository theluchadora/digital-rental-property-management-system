import apiClient from "@/lib/api-client";

export const chapaApi = {
  initializePayment: async (params: any) => {
    const response = await apiClient.post("/payments/initialize", params);
    return response.data;
  },

  verifyTransaction: async (txRef: string, invoiceId?: string) => {
    const response = await apiClient.get(`/payments/verify/${txRef}`, {
      params: invoiceId ? { invoiceId } : undefined,
    });
    return {
      status: response.data.status === 'paid' ? 'success' : 'failed',
      data: response.data,
    };
  },
};