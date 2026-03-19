export type ReturnStatus = "pending" | "accepted" | "refused";

export interface ReturnRequest {
  orderId: number;
  reason: string;
  status: ReturnStatus;
  requestedAt: string;
  updatedAt?: string;
}

const RETURNS_KEY = "sisma_return_requests";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readReturns(): Record<string, ReturnRequest> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, ReturnRequest>>(window.localStorage.getItem(RETURNS_KEY), {});
}

function writeReturns(next: Record<string, ReturnRequest>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RETURNS_KEY, JSON.stringify(next));
}

export function getReturnRequest(orderId: number): ReturnRequest | null {
  if (typeof window === "undefined") return null;
  const current = readReturns();
  return current[String(orderId)] ?? null;
}

export function saveReturnRequest(request: ReturnRequest) {
  if (typeof window === "undefined") return;
  const current = readReturns();
  current[String(request.orderId)] = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  writeReturns(current);
}
