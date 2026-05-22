import apiClient from "@/lib/api-client";

export type ChapaInitializeParams = {
  amount: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  invoice_id?: string;
};

export type ChapaInitializeResponse = {
  checkout_url: string;
  tx_ref: string;
  test_mode?: boolean;
  test_phones?: string[];
  phone_used?: string;
};

export const chapaApi = {
  initializePayment: async (params: ChapaInitializeParams): Promise<ChapaInitializeResponse> => {
    const response = await apiClient.post<ChapaInitializeResponse>("/payments/initialize", params);
    return response.data;
  },

  verifyTransaction: async (txRef: string, invoiceId?: string) => {
    const response = await apiClient.get<{ status: string }>(`/payments/verify/${txRef}`, {
      params: invoiceId ? { invoiceId } : undefined,
    });
    return {
      status: response.data.status === "paid" ? ("success" as const) : ("pending" as const),
      data: response.data,
    };
  },
};
