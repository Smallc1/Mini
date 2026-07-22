"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "概览" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/payments", label: "收款审核" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/support", label: "客服消息" },
];

export default function AdminNav({ unreadCount = 0, paymentCount = 0, userCount = 0 }: { unreadCount?: number; paymentCount?: number; userCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 md:w-52 md:flex-col md:gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "shrink-0 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                : "shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            }
          >
            <span className="flex items-center justify-between gap-2">{link.label}{link.href === "/admin/orders" && unreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs text-white">{unreadCount}</span>}{link.href === "/admin/payments" && paymentCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs text-white">{paymentCount}</span>}{link.href === "/admin/users" && userCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs text-white">{userCount}</span>}</span>
          </Link>
        );
      })}
    </nav>
  );
}
