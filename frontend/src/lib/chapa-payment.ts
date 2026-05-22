import { chapaApi } from "@/lib/api/chapa";

export function invoiceAmount(amountDue: number | string): string {
  const n = Number(amountDue);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid invoice amount");
  }
  return n.toFixed(2);
}

export type ChapaPayParams = {
  amountDue: number | string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  invoiceId: string;
};

export type ChapaPayResult = {
  checkoutUrl: string;
  txRef: string;
  testMode?: boolean;
  testPhones?: string[];
};

export async function startChapaPayment(params: ChapaPayParams): Promise<ChapaPayResult> {
  const response = await chapaApi.initializePayment({
    amount: invoiceAmount(params.amountDue),
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    phone_number: params.phoneNumber,
    invoice_id: params.invoiceId,
  });

  if (!response.checkout_url) {
    throw new Error("Chapa did not return a checkout URL");
  }

  return {
    checkoutUrl: response.checkout_url,
    txRef: response.tx_ref,
    testMode: response.test_mode,
    testPhones: response.test_phones,
  };
}

const MAX_POLL_ATTEMPTS = 60;

export function pollChapaPayment(
  invoiceId: string,
  txRef: string,
  onSuccess: () => void,
  onGiveUp?: () => void
): () => void {
  let attempts = 0;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const check = async () => {
    if (cancelled) return;
    attempts += 1;
    try {
      const result = await chapaApi.verifyTransaction(txRef, invoiceId);
      if (result.status === "success") {
        localStorage.removeItem(`paying_invoice_${invoiceId}`);
        onSuccess();
        return;
      }
    } catch {
      // keep polling
    }

    if (attempts >= MAX_POLL_ATTEMPTS) {
      onGiveUp?.();
      return;
    }

    timer = setTimeout(check, 5000);
  };

  check();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

export function openChapaCheckout(checkoutUrl: string, txRef: string, invoiceId: string) {
  localStorage.setItem(`paying_invoice_${invoiceId}`, txRef);
  const opened = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = checkoutUrl;
  }
}
