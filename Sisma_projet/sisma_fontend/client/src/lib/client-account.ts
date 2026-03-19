import type { CustomerProfile } from "@/lib/customerProfile";
import { getLastCustomerPhone, getSignupPrefill, normalizePhone } from "@/lib/customerProfile";

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  recommendations: boolean;
}

export interface MemberProfile extends CustomerProfile {
  userId?: number | null;
  createdAt?: string;
  lastLoginAt?: string;
}

interface PersonalizationState {
  viewedProductIds: number[];
  recentOrderProductIds: number[];
  categoryAffinity: Record<string, number>;
  supplierAffinity: Record<string, number>;
}

const MEMBER_PROFILE_KEY = "sisma_member_profile";
const NOTIFICATION_PREFS_KEY = "sisma_notification_preferences";
const PERSONALIZATION_KEY = "sisma_personalization_state";

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  orderUpdates: true,
  promotions: true,
  recommendations: true,
};

const DEFAULT_PERSONALIZATION_STATE: PersonalizationState = {
  viewedProductIds: [],
  recentOrderProductIds: [],
  categoryAffinity: {},
  supplierAffinity: {},
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function pushUnique(values: number[], nextValue?: number | null, limit = 20) {
  if (!nextValue || !Number.isFinite(nextValue)) return values;
  return [nextValue, ...values.filter((value) => value !== nextValue)].slice(0, limit);
}

function increaseAffinity(map: Record<string, number>, key?: number | string | null, amount = 1) {
  if (key === undefined || key === null || key === "") return;
  const normalizedKey = String(key);
  map[normalizedKey] = (map[normalizedKey] ?? 0) + amount;
}

export function getMemberProfile(): MemberProfile | null {
  return readStorage<MemberProfile | null>(MEMBER_PROFILE_KEY, null);
}

export function saveMemberProfile(profile: MemberProfile) {
  const current = getMemberProfile();
  writeStorage(MEMBER_PROFILE_KEY, {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

export function markMemberLogin(profile: Partial<MemberProfile>) {
  const current = getMemberProfile();
  saveMemberProfile({
    name: profile.name ?? current?.name ?? "",
    phone: profile.phone ?? current?.phone ?? "",
    email: profile.email ?? current?.email ?? null,
    commune: profile.commune ?? current?.commune ?? null,
    quartier: profile.quartier ?? current?.quartier ?? null,
    repere: profile.repere ?? current?.repere ?? null,
    customerLocation: profile.customerLocation ?? current?.customerLocation ?? null,
    userId: profile.userId ?? current?.userId ?? null,
    createdAt: profile.createdAt ?? current?.createdAt,
    ...profile,
    lastLoginAt: new Date().toISOString(),
  });
}

export function clearMemberProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MEMBER_PROFILE_KEY);
}

export function getNotificationPreferences(): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStorage<Partial<NotificationPreferences>>(NOTIFICATION_PREFS_KEY, {}),
  };
}

export function saveNotificationPreferences(preferences: NotificationPreferences) {
  writeStorage(NOTIFICATION_PREFS_KEY, preferences);
}

export function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean,
) {
  saveNotificationPreferences({
    ...getNotificationPreferences(),
    [key]: value,
  });
}

export function getPersonalizationState(): PersonalizationState {
  return {
    ...DEFAULT_PERSONALIZATION_STATE,
    ...readStorage<Partial<PersonalizationState>>(PERSONALIZATION_KEY, {}),
  };
}

export function recordViewedProduct(product: {
  id?: number;
  category_id?: number;
  categoryId?: number;
  supplier_id?: number;
  supplierId?: number;
}) {
  const current = getPersonalizationState();
  const next: PersonalizationState = {
    ...current,
    viewedProductIds: pushUnique(current.viewedProductIds, Number(product.id ?? 0)),
    recentOrderProductIds: current.recentOrderProductIds.slice(0, 20),
    categoryAffinity: { ...current.categoryAffinity },
    supplierAffinity: { ...current.supplierAffinity },
  };

  increaseAffinity(next.categoryAffinity, product.category_id ?? product.categoryId, 2);
  increaseAffinity(next.supplierAffinity, product.supplier_id ?? product.supplierId, 1);

  writeStorage(PERSONALIZATION_KEY, next);
}

export function recordCompletedOrder(
  items: Array<{
    id?: number;
    category_id?: number;
    categoryId?: number;
    supplier_id?: number;
    supplierId?: number;
  }>,
) {
  const current = getPersonalizationState();
  const next: PersonalizationState = {
    ...current,
    viewedProductIds: current.viewedProductIds.slice(0, 20),
    recentOrderProductIds: [...current.recentOrderProductIds],
    categoryAffinity: { ...current.categoryAffinity },
    supplierAffinity: { ...current.supplierAffinity },
  };

  items.forEach((item) => {
    next.recentOrderProductIds = pushUnique(next.recentOrderProductIds, Number(item.id ?? 0));
    increaseAffinity(next.categoryAffinity, item.category_id ?? item.categoryId, 4);
    increaseAffinity(next.supplierAffinity, item.supplier_id ?? item.supplierId, 3);
  });

  writeStorage(PERSONALIZATION_KEY, next);
}

function getProductCategoryId(product: any): string {
  return String(product?.category_id ?? product?.categoryId ?? product?.category?.id ?? "");
}

function getProductSupplierId(product: any): string {
  return String(product?.supplier_id ?? product?.supplierId ?? product?.supplier?.id ?? "");
}

function getDiscountValue(product: any): number {
  const value = Number(product?.discountPercentage ?? product?.discount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function derivePersonalizedRecommendations<T extends { id?: number }>(
  products: T[],
  limit = 6,
): T[] {
  const state = getPersonalizationState();

  return [...products]
    .map((product) => {
      const productId = Number((product as any)?.id ?? 0);
      const categoryScore = state.categoryAffinity[getProductCategoryId(product)] ?? 0;
      const supplierScore = state.supplierAffinity[getProductSupplierId(product)] ?? 0;
      const viewedBonus = state.viewedProductIds.includes(productId) ? 6 : 0;
      const orderedBonus = state.recentOrderProductIds.includes(productId) ? 10 : 0;
      const freshnessBonus = (state.recentOrderProductIds.length + state.viewedProductIds.length) > 0 ? 2 : 0;
      const discountBonus = getDiscountValue(product) * 0.6;

      return {
        product,
        score: categoryScore * 3 + supplierScore * 2 + viewedBonus + orderedBonus + freshnessBonus + discountBonus,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

export function deriveMemberDeals<T extends { id?: number }>(products: T[], limit = 6): T[] {
  return [...products]
    .filter((product) => getDiscountValue(product) > 0)
    .sort((left, right) => getDiscountValue(right) - getDiscountValue(left))
    .slice(0, limit);
}

export function hasPostOrderSignal(): boolean {
  const signupPrefill = getSignupPrefill();
  if (signupPrefill?.phone) return true;

  const lastPhone = getLastCustomerPhone();
  return Boolean(normalizePhone(lastPhone || ""));
}
