import Link from "next/link";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/roles";

export default async function CustomerServiceButton() {
  const session = await auth();
  if (!session?.user) return null;
  return <Link href={isAdminRole(session.user.role) ? "/admin/support" : "/support"} className="fixed left-5 top-24 z-40 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-500" aria-label="联系客服"><span className="text-lg">💬</span>客服</Link>;
}
