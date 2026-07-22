/** Format a price stored in integer cents to a display string like "¥12.34". */
export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export type MemberLevel = "NORMAL" | "VIP" | "SVIP";

export function getMembership(totalSpent: number): {
  level: MemberLevel;
  label: string;
  discount: number;
} {
  if (totalSpent >= 2_000_000) return { level: "SVIP", label: "SVIP 用户", discount: 0.8 };
  if (totalSpent >= 500_000) return { level: "VIP", label: "VIP 用户", discount: 0.9 };
  return { level: "NORMAL", label: "普通用户", discount: 1 };
}

export function applyMemberDiscount(total: number, discount: number): number {
  return Math.round(total * discount);
}

/** Turn a product/category name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-violet-100 text-violet-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};
