import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 正在写入种子数据...");

  // Clean existing data (order matters for FK constraints)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.user.create({
    data: {
      email: "manager@minimall.com",
      name: "演示管理员",
      passwordHash: managerPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@minimall.com",
      name: "admin",
      passwordHash: adminPassword,
      role: "OWNER",
    },
  });

  await prisma.user.create({
    data: {
      email: "user@minimall.com",
      name: "演示用户",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  // Categories
  // Chinese names can't be slugified to ASCII, so slugs are set explicitly.
  const categoryData = [
    { name: "数码电子", slug: "electronics" },
    { name: "图书", slug: "books" },
    { name: "家居厨房", slug: "home-kitchen" },
  ];
  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c }))
  );
  const [electronics, books, home] = categories;

  // Products
  const products = [
    {
      name: "无线蓝牙耳机",
      slug: "wireless-headphones",
      description: "头戴式蓝牙耳机，支持主动降噪，续航长达 30 小时。",
      price: 8999,
      stock: 25,
      categoryId: electronics.id,
      imageUrl: "https://picsum.photos/seed/headphones/600/600",
    },
    {
      name: "机械键盘",
      slug: "mechanical-keyboard",
      description: "75% 紧凑布局机械键盘，支持热插拔轴体，带 RGB 背光。",
      price: 12900,
      stock: 15,
      categoryId: electronics.id,
      imageUrl: "https://picsum.photos/seed/keyboard/600/600",
    },
    {
      name: "程序员修炼之道",
      slug: "pragmatic-programmer",
      description: "软件工艺经典之作，助你从学徒成长为大师。",
      price: 3499,
      stock: 40,
      categoryId: books.id,
      imageUrl: "https://picsum.photos/seed/pragmatic/600/600",
    },
    {
      name: "代码整洁之道",
      slug: "clean-code",
      description: "Robert C. Martin 所著的敏捷软件工艺实战手册。",
      price: 3299,
      stock: 30,
      categoryId: books.id,
      imageUrl: "https://picsum.photos/seed/cleancode/600/600",
    },
    {
      name: "陶瓷咖啡杯",
      slug: "ceramic-coffee-mug",
      description: "355ml 炻瓷马克杯，手感舒适，可微波炉与洗碗机使用。",
      price: 1499,
      stock: 100,
      categoryId: home.id,
      imageUrl: "https://picsum.photos/seed/mug/600/600",
    },
    {
      name: "不锈钢电热水壶",
      slug: "stainless-steel-kettle",
      description: "1.7L 电热水壶，快速煮沸，自动断电。",
      price: 4599,
      stock: 20,
      categoryId: home.id,
      imageUrl: "https://picsum.photos/seed/kettle/600/600",
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`✅ 已写入 ${categories.length} 个分类，${products.length} 件商品`);
  console.log(`   管理员账号：admin@minimall.com / admin123`);
  console.log(`   顾客账号：  user@minimall.com / user123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
