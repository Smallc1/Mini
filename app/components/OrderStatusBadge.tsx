import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  type OrderStatus,
} from "@/lib/utils";

export default function OrderStatusBadge({ status }: { status: string }) {
  const key = (status as OrderStatus) in ORDER_STATUS_LABELS
    ? (status as OrderStatus)
    : "PENDING";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[key]}`}
    >
      {ORDER_STATUS_LABELS[key]}
    </span>
  );
}
