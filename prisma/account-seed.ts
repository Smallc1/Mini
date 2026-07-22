import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const accounts = [
  { prefix: "OWNER", role: "OWNER", defaultName: "商城站长" },
  { prefix: "MANAGER", role: "ADMIN", defaultName: "商城管理员" },
  { prefix: "USER", role: "USER", defaultName: "商城用户" },
] as const;

async function main() {
  let configuredCount = 0;

  for (const account of accounts) {
    const email = process.env[`${account.prefix}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`${account.prefix}_PASSWORD`];
    const name = process.env[`${account.prefix}_NAME`]?.trim() || account.defaultName;

    if (!email && !password) {
      continue;
    }
    if (!email || !password || password.length < 6) {
      throw new Error(`${account.prefix}_EMAIL 和 ${account.prefix}_PASSWORD 需同时填写，密码必须至少 6 位`);
    }

    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: account.role,
        isDisabled: false,
      },
      create: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: account.role,
        isDisabled: false,
      },
    });
    configuredCount += 1;
    console.log(`已配置 ${account.role}：${email}`);
  }

  if (configuredCount === 0) {
    throw new Error("至少需配置一组账号环境变量");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
