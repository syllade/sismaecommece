export interface CustomerProfile {
  name: string;
  phone: string;
  email?: string | null;
  commune?: string | null;
  quartier?: string | null;
  repere?: string | null;
  customerLocation?: string | null;
  updatedAt?: string;
}

const PROFILE_KEY = "sisma_customer_profiles";
const LAST_PHONE_KEY = "sisma_last_customer_phone";
const SIGNUP_PREFILL_KEY = "sisma_signup_prefill";
const GUEST_ORDER_FLAG_KEY = "sisma_guest_order_placed";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function normalizePhone(input: string): string {
  return String(input || "").replace(/\D/g, "");
}

function readProfiles(): Record<string, CustomerProfile> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, CustomerProfile>>(
    window.localStorage.getItem(PROFILE_KEY),
    {},
  );
}

function writeProfiles(next: Record<string, CustomerProfile>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
}

export function saveCustomerProfile(profile: CustomerProfile) {
  if (typeof window === "undefined") return;
  const phoneKey = normalizePhone(profile.phone);
  if (!phoneKey) return;
  const current = readProfiles();
  current[phoneKey] = {
    ...current[phoneKey],
    ...profile,
    phone: profile.phone,
    updatedAt: new Date().toISOString(),
  };
  writeProfiles(current);
}

export function getCustomerProfileByPhone(phone: string): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  const phoneKey = normalizePhone(phone);
  if (!phoneKey) return null;
  const current = readProfiles();
  return current[phoneKey] ?? null;
}

export function setLastCustomerPhone(phone: string) {
  if (typeof window === "undefined") return;
  const phoneKey = normalizePhone(phone);
  if (!phoneKey) return;
  window.localStorage.setItem(LAST_PHONE_KEY, phoneKey);
}

export function getLastCustomerPhone(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_PHONE_KEY);
}

export function clearLastCustomerPhone() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LAST_PHONE_KEY);
}

export function saveSignupPrefill(profile: CustomerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIGNUP_PREFILL_KEY, JSON.stringify(profile));
}

export function getSignupPrefill(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  return safeParse<CustomerProfile | null>(window.localStorage.getItem(SIGNUP_PREFILL_KEY), null);
}

export function clearSignupPrefill() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_PREFILL_KEY);
}

// Guest order flag - set when a guest places an order to prompt account creation
export function setGuestOrderPlaced() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_ORDER_FLAG_KEY, new Date().toISOString());
}

export function getGuestOrderPlaced(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_ORDER_FLAG_KEY) !== null;
}

export function clearGuestOrderPlaced() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_ORDER_FLAG_KEY);
}
