"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavAction({
  href,
  label,
  iconClassName,
  activeIconClassName,
  activePaths,
  children,
}: {
  href: string;
  label: string;
  iconClassName: string;
  activeIconClassName: string;
  activePaths: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = activePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <Link
      href={href}
      className={`group hidden flex-col items-center justify-center gap-1 transition focus-visible:outline-none md:flex ${
        active ? "font-semibold text-slate-950" : "text-slate-700 hover:text-slate-950"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition duration-200 ease-out group-hover:scale-110 group-hover:shadow-md group-focus-visible:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-focus-visible:ring-offset-2 ${
          active ? activeIconClassName : iconClassName
        }`}
      >
        {children}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
