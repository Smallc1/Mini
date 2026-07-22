import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSupportMessage } from "./actions";
import { SupportMessageInput } from "./SupportMessageInput";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/support");
  if (isAdminRole(session.user.role)) redirect("/admin/support");
  await prisma.$transaction([
    prisma.supportMessage.updateMany({ where: { userId: session.user.id, senderId: { not: session.user.id } }, data: { readByUser: true } }),
    prisma.notification.updateMany({ where: { recipientId: session.user.id, type: "SUPPORT_REPLY", isRead: false }, data: { isRead: true } }),
  ]);
  const messages = await prisma.supportMessage.findMany({ where: { userId: session.user.id }, include: { sender: { select: { role: true } } }, orderBy: { createdAt: "asc" } });
  for (const message of messages) if (message.sender.role === "OWNER") message.sender.role = "ADMIN";
  return <div className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-semibold">在线客服</h1><div className="min-h-[420px] space-y-3 rounded-2xl border border-slate-200 bg-white p-5">{messages.length === 0 && <p className="text-center text-sm text-slate-400">暂无对话，可在下方咨询客服。</p>}{messages.map((message) => <div key={message.id} className={`flex ${message.senderId === session.user.id ? "justify-end" : "justify-start"}`}><div className={message.senderId === session.user.id ? "max-w-[75%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-3 text-white" : "max-w-[75%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-slate-800"}><p className="text-xs opacity-70">{message.sender.role === "ADMIN" ? "客服" : "我"}</p><p className="mt-1 whitespace-pre-wrap text-sm">{message.content}</p></div></div>)}</div><form action={sendSupportMessage} className="flex gap-2"><SupportMessageInput name="content" required rows={2} placeholder="请输入您要咨询的问题…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-violet-500" /><button className="rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-700">发送</button></form></div>;
}
