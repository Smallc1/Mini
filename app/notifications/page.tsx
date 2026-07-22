import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openNotification } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/notifications");
  const notifications = await prisma.notification.findMany({ where: { recipientId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const notificationGroups = notifications.reduce<Array<typeof notifications>>((groups, notification) => {
    const isSupportMessage = notification.type === "SUPPORT" || notification.type === "SUPPORT_REPLY";
    if (!isSupportMessage) {
      groups.push([notification]);
      return groups;
    }

    const existingGroup = groups.find((group) => {
      const first = group[0];
      return first.type === notification.type && first.link === notification.link;
    });

    if (existingGroup) existingGroup.push(notification);
    else groups.push([notification]);
    return groups;
  }, []);
  return <div className="mx-auto max-w-4xl space-y-5"><h1 className="text-2xl font-semibold">消息通知</h1>{notifications.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">暂无消息</div> : <div className="space-y-3">{notificationGroups.map((group) => {
    const latest = group[0];
    const unreadCount = group.filter((item) => !item.isRead).length;
    return <form key={latest.id} action={openNotification}><input type="hidden" name="notificationIds" value={group.map((item) => item.id).join(",")} /><input type="hidden" name="link" value={latest.link || "/notifications"} /><button type="submit" className={`block w-full rounded-xl border p-4 text-left transition hover:border-violet-300 ${unreadCount > 0 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="flex justify-between gap-4"><div className="min-w-0 flex-1"><p className="flex items-center gap-2 font-semibold">{latest.title}{unreadCount > 0 ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-medium text-white">{unreadCount} 条未读</span> : group.length > 1 ? <span className="text-xs font-normal text-slate-400">{group.length} 条消息</span> : null}</p><div className="mt-2 divide-y divide-slate-100">{group.map((item) => <div key={item.id} className="py-2 first:pt-0 last:pb-0"><p className="whitespace-pre-wrap text-sm text-slate-600">{item.content}</p><p className="mt-1 text-xs text-slate-400">{item.createdAt.toLocaleString("zh-CN")}</p></div>)}</div></div>{unreadCount > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}</div></button></form>;
  })}</div>}</div>;
}
