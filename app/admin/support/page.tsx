import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSupportMessage } from "@/app/support/actions";
import { SupportMessageInput } from "@/app/support/SupportMessageInput";

type SearchParams = Promise<{ user?: string }>;
export const dynamic = "force-dynamic";

export default async function AdminSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const { user: selectedId } = await searchParams;
  const users = await prisma.user.findMany({ where: { supportMessages: { some: {} } }, include: { supportMessages: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
  const activeId = selectedId ?? users[0]?.id;
  if (activeId) await prisma.$transaction([
    prisma.supportMessage.updateMany({ where: { userId: activeId }, data: { readByAdmin: true } }),
    prisma.notification.updateMany({ where: { recipientId: session?.user?.id, type: "SUPPORT", link: `/admin/support?user=${activeId}`, isRead: false }, data: { isRead: true } }),
  ]);
  const messages = activeId ? await prisma.supportMessage.findMany({ where: { userId: activeId }, include: { sender: { select: { role: true } } }, orderBy: { createdAt: "asc" } }) : [];
  for (const message of messages) if (message.sender.role === "OWNER") message.sender.role = "ADMIN";
  const activeUser = users.find((user) => user.id === activeId);
  return <div className="space-y-4"><h2 className="text-lg font-semibold">客服消息</h2><div className="grid min-h-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white md:grid-cols-[240px_1fr]"><aside className="border-r border-slate-200">{users.map((user) => <Link key={user.id} href={`/admin/support?user=${user.id}`} className={`block border-b border-slate-100 px-4 py-3 ${activeId === user.id ? "bg-violet-50" : "hover:bg-slate-50"}`}><p className="font-medium">{user.name || user.email}</p><p className="truncate text-xs text-slate-400">{user.supportMessages[0]?.content}</p></Link>)}</aside><section className="flex min-w-0 flex-col"><header className="border-b border-slate-200 px-5 py-3 font-medium">{activeUser?.name || activeUser?.email || "请选择用户"}</header><div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map((message) => <div key={message.id} className={`flex ${message.sender.role === "ADMIN" ? "justify-end" : "justify-start"}`}><div className={message.sender.role === "ADMIN" ? "max-w-[75%] rounded-2xl bg-violet-600 px-4 py-3 text-sm text-white" : "max-w-[75%] rounded-2xl bg-slate-100 px-4 py-3 text-sm"}>{message.content}</div></div>)}</div>{activeId && <form action={sendSupportMessage} className="flex gap-2 border-t border-slate-200 p-4"><input type="hidden" name="userId" value={activeId} /><SupportMessageInput name="content" required rows={2} placeholder="回复用户…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" /><button className="rounded-xl bg-violet-600 px-5 font-medium text-white">发送</button></form>}</section></div></div>;
}
