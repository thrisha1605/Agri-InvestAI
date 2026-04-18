import { apiRequest } from "./api";
import { createSip, listSips, SipInterval, SipPayload, SipRecord, stopSip } from "./roleSip";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface RazorpayVerificationPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  userId?: string;
  projectId?: string;
  amount: number;
}

export interface SipCheckoutInput extends SipPayload {}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function createRazorpayOrder(amount: number): Promise<RazorpayOrderResponse> {
  return apiRequest<RazorpayOrderResponse>({
    method: "POST",
    url: "/api/payment/create-order",
    data: { amount },
  });
}

export async function verifyRazorpayPayment(payload: RazorpayVerificationPayload) {
  return apiRequest({
    method: "POST",
    url: "/api/payment/verify",
    data: payload,
  });
}

export async function startSipPlan(input: SipCheckoutInput): Promise<SipRecord> {
  if (!input.termsAccepted) {
    throw new Error("Please accept the SIP terms before continuing.");
  }

  if (!input.interval) {
    throw new Error("Please select a SIP interval.");
  }

  return createSip(input);
}

export async function fetchUserSipPlans(userId?: string): Promise<SipRecord[]> {
  return listSips(userId);
}

export async function cancelSipPlan(sipId: string): Promise<SipRecord> {
  return stopSip(sipId);
}

export const SIP_INTERVAL_OPTIONS: { label: string; value: SipInterval }[] = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Every 15 Days", value: "FIFTEEN_DAYS" },
  { label: "Monthly", value: "MONTHLY" },
];
