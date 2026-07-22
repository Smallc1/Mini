import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "商城管理员";

  if (!email || !password || password.length < 12) {
    throw new Error("ADMIN_EMAIL 必填，ADMIN_PASSWORD 必须至少 12 位");
  }

  const existingOwner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (existingOwner) {
    console.log(`管理员已存在（${existingOwner.email}），未修改任何数据。`);
    return;
  }

  await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12), role: "OWNER" },
  });
  console.log(`已创建管理员：${email}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
