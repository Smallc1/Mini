"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { isAdminRole } from "@/lib/roles";

export async function sendSupportMessage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/support");
  const content = String(formData.get("content") || "").trim();
  if (!content) return;
  const isAdmin = isAdminRole(session.user.role);
  const targetUserId = isAdmin ? String(formData.get("userId") || "") : session.user.id;
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return;
  await prisma.supportMessage.create({ data: { userId: targetUserId, senderId: session.user.id, content: content.slice(0, 1000), readByAdmin: isAdmin, readByUser: !isAdmin } });
  if (!isAdmin) {
    await notifyAdmins("SUPPORT", "新客服消息", `${session.user.name || session.user.email || "用户"}：${content.slice(0, 80)}`, `/admin/support?user=${targetUserId}`);
    revalidatePath("/admin/support");
    redirect("/support");
  }
  await prisma.notification.create({ data: { recipientId: targetUserId, type: "SUPPORT_REPLY", title: "客服已回复", content: content.slice(0, 100), link: "/support" } });
  revalidatePath("/support");
  redirect(`/admin/support?user=${targetUserId}`);
}
