import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getCartCount } from "@/lib/cart";
import CartCountBadge from "./CartCountBadge";
import NavAction from "./NavAction";
import { prisma } from "@/lib/prisma";
import { autoCompleteOrders } from "@/lib/orders";
import { isAdminRole } from "@/lib/roles";

export default async function Navbar() {
  const session = await auth();
  const isAdmin = isAdminRole(session?.user?.role);
  if (session?.user?.id) await autoCompleteOrders(isAdmin ? undefined : session.user.id);
  const cartCount = session?.user?.id ? await getCartCount(session.user.id) : 0;
  const adminUnreadCount = isAdmin ? await prisma.order.count({ where: { adminUnread: true } }) : 0;
  const userUnreadCount = session?.user?.id && !isAdmin ? await prisma.order.count({ where: { userId: session.user.id, userUnread: true } }) : 0;
  const notificationCount = session?.user?.id ? await prisma.notification.count({ where: { recipientId: session.user.id, isRead: false } }) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 min-w-0 w-full max-w-[83.333vw] items-center gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Mini Mall 首页"
        >
          <Image
            src="/mini-mall-logo.png"
            alt="Mini Mall"
            width={720}
            height={214}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <form
          action="/products"
          method="GET"
          className="hidden min-w-0 flex-1 md:block"
        >
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              placeholder="搜索商品..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </label>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-4 text-sm">
          {session && <NavAction href="/notifications" label="消息通知" iconClassName="border-amber-200 bg-amber-50 text-amber-600 shadow-amber-100/80 group-hover:border-amber-300 group-hover:bg-amber-100" activeIconClassName="border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200" activePaths={["/notifications"]}><span className="relative"><BellIcon className="h-6 w-6" />{notificationCount > 0 && <span className="absolute -right-3 -top-3 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{notificationCount}</span>}</span></NavAction>}
          <NavAction
            href="/cart"
            label="购物车"
            iconClassName="border-rose-200 bg-rose-50 text-rose-500 shadow-rose-100/80 group-hover:border-rose-300 group-hover:bg-rose-100"
            activeIconClassName="border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-200"
            activePaths={["/cart", "/checkout"]}
          >
            <div className="relative">
              <CartIcon className="h-6 w-6" />
              <CartCountBadge initialCount={cartCount} />
            </div>
          </NavAction>

          <NavAction
            href={isAdmin ? "/admin/products" : "/products"}
            label={isAdmin ? "商品管理" : "全部商品"}
            iconClassName="border-amber-200 bg-amber-50 text-amber-600 shadow-amber-100/80 group-hover:border-amber-300 group-hover:bg-amber-100"
            activeIconClassName="border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200"
            activePaths={isAdmin ? ["/admin/products"] : ["/products"]}
          >
            <BoxIcon className="h-6 w-6" />
          </NavAction>

          {session && (
            <NavAction
              href={isAdmin ? "/admin/orders" : "/orders"}
              label={isAdmin ? "订单管理" : "全部订单"}
              iconClassName="border-violet-200 bg-violet-50 text-violet-600 shadow-violet-100/80 group-hover:border-violet-300 group-hover:bg-violet-100"
              activeIconClassName="border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-200"
              activePaths={isAdmin ? ["/admin/orders"] : ["/orders"]}
            >
              <span className="relative"><OrderIcon className="h-6 w-6" />{(isAdmin ? adminUnreadCount : userUnreadCount) > 0 && <span className="absolute -right-3 -top-3 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{isAdmin ? adminUnreadCount : userUnreadCount}</span>}</span>
            </NavAction>
          )}

          {isAdmin && (
            <NavAction
              href="/admin/users"
              label="用户管理"
              iconClassName="border-teal-200 bg-teal-50 text-teal-600 shadow-teal-100/80 group-hover:border-teal-300 group-hover:bg-teal-100"
              activeIconClassName="border-teal-500 bg-teal-500 text-white shadow-md shadow-teal-200"
              activePaths={["/admin/users"]}
            >
              <UsersIcon className="h-6 w-6" />
            </NavAction>
          )}

          <NavAction
            href={session ? "/profile" : "/login"}
            label="用户中心"
            iconClassName="border-sky-200 bg-sky-50 text-sky-600 shadow-sky-100/80 group-hover:border-sky-300 group-hover:bg-sky-100"
            activeIconClassName="border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-200"
            activePaths={["/profile", "/login", "/register"]}
          >
            <UserIcon className="h-6 w-6" />
          </NavAction>

          {!session && (
            <Link
              href="/login"
              className="hidden rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 md:inline-flex"
            >
              登录
            </Link>
          )}
        </div>
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden" aria-label="移动端主导航">
        <MobileLink href="/" label="首页" icon="⌂" />
        <MobileLink href="/products" label="商品" icon="▦" />
        <MobileLink href="/cart" label="购物车" icon="🛒" badge={cartCount} />
        <MobileLink href={session ? (isAdmin ? "/admin/orders" : "/orders") : "/login"} label={isAdmin ? "管理" : "订单"} icon="▤" badge={isAdmin ? adminUnreadCount : userUnreadCount} />
        <MobileLink href={session ? "/profile" : "/login"} label="我的" icon="○" badge={notificationCount} />
      </nav>
    </header>
  );
}

function MobileLink({ href, label, icon, badge = 0 }: { href: string; label: string; icon: string; badge?: number }) {
  return <Link href={href} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-600 active:bg-slate-50" aria-label={label}><span className="text-xl leading-none" aria-hidden="true">{icon}</span><span>{label}</span>{badge > 0 && <span className="absolute right-[22%] top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>}</Link>;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M3 4h2l2.4 12.1A2 2 0 0 0 9.4 18h7.8a2 2 0 0 0 2-1.6l1.6-8.4H6.1" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3.5 7 8.5-4 8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 7v10l8.5 4 8.5-4V7" />
      <path d="m12 11v10" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-3.4 4.7-5 8-5s6.2 1.6 8 5" />
    </svg>
  );
}

function OrderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3.5 19c.8-3.4 2.8-5 5.5-5s4.7 1.6 5.5 5M14.5 15c2.8-.8 5.1.5 6 3" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}
