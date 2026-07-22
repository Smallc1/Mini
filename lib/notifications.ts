import { prisma } from "@/lib/prisma";

export async function notifyAdmins(type: string, title: string, content: string, link?: string) {
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "OWNER"] }, isDisabled: false }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({ data: admins.map((admin) => ({ recipientId: admin.id, type, title, content, link })) });
}

export async function notifyOwner(type: string, title: string, content: string, link?: string) {
  const owners = await prisma.user.findMany({ where: { role: "OWNER", isDisabled: false }, select: { id: true } });
  if (owners.length === 0) return;
  await prisma.notification.createMany({ data: owners.map((owner) => ({ recipientId: owner.id, type, title, content, link })) });
}
