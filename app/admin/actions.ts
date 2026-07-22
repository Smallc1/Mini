"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugify, ORDER_STATUSES } from "@/lib/utils";
import { productSchema, categorySchema } from "@/lib/validations";
import { getCatalogDepartment } from "@/lib/catalog-db";
import { isAdminRole, isOwnerRole } from "@/lib/roles";
import { saveOrderReview } from "@/lib/order-reviews";
import { notifyOwner } from "@/lib/notifications";
import { removeProductImage, saveProductImage } from "@/lib/product-image-storage";

export type ActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) {
    redirect("/");
  }
}

/** Ensure a slug is unique, appending a short suffix if needed. */
async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "product";
  let n = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

// ---------- Products ----------

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const imageFile = getImageFile(formData);
  const values = Object.fromEntries(formData);
  if (imageFile && !values.imageUrl) values.imageUrl = "/uploads/products/pending.jpg";
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const data = parsed.data;
  const department = await getCatalogDepartment(data.departmentSlug);
  if (!department?.subcategories.some((item) => item.name === data.subcategoryName)) {
    return { error: "商品大类与小类不匹配" };
  }
  const slug = await uniqueProductSlug(slugify(data.name));

  let uploadedImageUrl: string | undefined;
  try {
    if (imageFile) uploadedImageUrl = await saveProductImage(imageFile);
    await prisma.product.create({
      data: {
      name: data.name,
      slug,
      description: data.description,
      price: Math.round(data.price * 100),
      imageUrl: uploadedImageUrl ?? data.imageUrl,
      stock: data.stock,
      categoryId: data.categoryId,
      departmentSlug: data.departmentSlug,
      subcategoryName: data.subcategoryName,
      isActive: data.isActive,
      },
    });
  } catch (error) {
    if (uploadedImageUrl) await removeProductImage(uploadedImageUrl);
    if (error instanceof Error && error.message) return { error: error.message };
    return { error: "商品创建失败" };
  }
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员新增商品", `${actor.user.name || actor.user.email} 新增商品「${data.name}」`, "/admin/products");

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const imageFile = getImageFile(formData);
  const values = Object.fromEntries(formData);
  if (imageFile && !values.imageUrl) values.imageUrl = "/uploads/products/pending.jpg";
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const data = parsed.data;
  const department = await getCatalogDepartment(data.departmentSlug);
  if (!department?.subcategories.some((item) => item.name === data.subcategoryName)) {
    return { error: "商品大类与小类不匹配" };
  }
  const slug = await uniqueProductSlug(slugify(data.name), id);

  const existingProduct = await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } });
  if (!existingProduct) return { error: "商品不存在" };
  let uploadedImageUrl: string | undefined;
  try {
    if (imageFile) uploadedImageUrl = await saveProductImage(imageFile);
    await prisma.product.update({
      where: { id },
      data: {
      name: data.name,
      slug,
      description: data.description,
      price: Math.round(data.price * 100),
      imageUrl: uploadedImageUrl ?? data.imageUrl,
      stock: data.stock,
      categoryId: data.categoryId,
      departmentSlug: data.departmentSlug,
      subcategoryName: data.subcategoryName,
      isActive: data.isActive,
      },
    });
  } catch (error) {
    if (uploadedImageUrl) await removeProductImage(uploadedImageUrl);
    if (error instanceof Error && error.message) return { error: error.message };
    return { error: "商品保存失败" };
  }
  const savedImageUrl = uploadedImageUrl ?? data.imageUrl;
  if (existingProduct.imageUrl !== savedImageUrl) {
    await removeProductImage(existingProduct.imageUrl);
  }
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员修改商品", `${actor.user.name || actor.user.email} 修改商品「${data.name}」的商品信息和库存`, "/admin/products");

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

function getImageFile(formData: FormData): File | undefined {
  const value = formData.get("imageFile");
  return value instanceof File && value.size > 0 ? value : undefined;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true, imageUrl: true } });
  if (!product) return { error: "商品不存在" };
  const referenced = await prisma.orderItem.count({ where: { productId: id } });
  if (referenced > 0) {
    return { error: "该商品已存在订单记录，请改为下架" };
  }
  await prisma.product.delete({ where: { id } });
  await removeProductImage(product.imageUrl);
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员删除商品", `${actor.user.name || actor.user.email} 删除商品「${product.name}」`, "/admin/products");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function batchUpdateProducts(
  ids: string[],
  operation: "deactivate" | "delete"
) {
  await requireAdmin();
  const productIds = [...new Set(ids)].filter(Boolean);
  if (productIds.length === 0) return { error: "请至少选择一件商品" };

  if (operation === "deactivate") {
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isActive: false },
    });
    const actor = await auth();
    if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员下架商品", `${actor.user.name || actor.user.email} 下架了 ${productIds.length} 件商品`, "/admin/products");
  } else if (operation === "delete") {
    const referenced = await prisma.orderItem.count({
      where: { productId: { in: productIds } },
    });
    if (referenced > 0) {
      return { error: "选中商品已存在订单记录，请改用批量下架" };
    }
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { imageUrl: true } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await Promise.all(products.map((product) => removeProductImage(product.imageUrl)));
    const actor = await auth();
    if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员删除商品", `${actor.user.name || actor.user.email} 删除了 ${productIds.length} 件商品`, "/admin/products");
  } else {
    return { error: "无效的批量操作" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adjustProductStock(id: string, change: number) {
  await requireAdmin();
  if (!Number.isInteger(change) || ![-10, 10].includes(change)) {
    return { error: "无效的库存调整" };
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { stock: true },
  });
  if (!product) return { error: "商品不存在" };
  if (change < 0 && product.stock === 0) return { error: "库存已经为 0" };

  const updated = await prisma.product.update({
    where: { id },
    data: { stock: Math.max(0, product.stock + change) },
    select: { stock: true },
  });
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员调整库存", `${actor.user.name || actor.user.email} 调整商品库存 ${change > 0 ? "增加" : "减少"} ${Math.abs(change)} 件`, "/admin/products");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true, stock: updated.stock };
}

export async function setProductStock(id: string, stock: number) {
  await requireAdmin();
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "库存必须是大于或等于 0 的整数" };
  }

  const updated = await prisma.product.updateMany({
    where: { id },
    data: { stock },
  });
  if (updated.count === 0) return { error: "商品不存在" };
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员修改库存", `${actor.user.name || actor.user.email} 将商品库存修改为 ${stock}`, "/admin/products");

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true, stock };
}

export async function setProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  if (typeof isActive !== "boolean") return { error: "无效的商品状态" };

  const updated = await prisma.product.updateMany({
    where: { id },
    data: { isActive },
  });
  if (updated.count === 0) return { error: "商品不存在" };
  const actor = await auth();
  if (actor?.user?.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", isActive ? "管理员上架商品" : "管理员下架商品", `${actor.user.name || actor.user.email} ${isActive ? "上架" : "下架"}了商品`, "/admin/products");

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Categories ----------

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const catalogKind = formData.get("catalogKind") === "DEPARTMENT" ? "DEPARTMENT" : "SUBCATEGORY";
  const parentSlug = catalogKind === "SUBCATEGORY" ? String(formData.get("parentSlug") || "") : null;
  if (catalogKind === "SUBCATEGORY" && !(await getCatalogDepartment(parentSlug ?? undefined))) {
    return { error: "请选择有效的所属一级大类" };
  }
  const baseSlug = slugify(parsed.data.name) || `custom-${Date.now().toString(36)}`;
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;
  const existing = await prisma.category.findFirst({
    where: { name: parsed.data.name },
  });
  if (existing) return { error: "该分类名称已存在" };

  await prisma.category.create({ data: { name: parsed.data.name, slug, catalogKind, parentSlug, source: "ADMIN" } });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return undefined;
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { error: "分类不存在" };
  if (category?.catalogKind === "DEPARTMENT") {
    const childCount = await prisma.category.count({ where: { catalogKind: "SUBCATEGORY", parentSlug: category.slug } });
    if (childCount > 0) return { error: `无法删除：该大类下还有 ${childCount} 个二级小类` };
  }
  const products = await prisma.product.findMany({ where: { categoryId: id }, select: { id: true, subcategoryName: true } });
  if (products.length > 0) {
    const fallback = await prisma.category.findFirst({ where: { id: { not: id }, catalogKind: { not: "DEPARTMENT" } }, orderBy: { name: "asc" } });
    if (!fallback) return { error: "无法删除：没有可用的替代分类" };
    for (const product of products) {
      const matching = product.subcategoryName
        ? await prisma.category.findFirst({ where: { id: { not: id }, name: product.subcategoryName, catalogKind: { not: "DEPARTMENT" } } })
        : null;
      await prisma.product.update({ where: { id: product.id }, data: { categoryId: matching?.id ?? fallback.id } });
    }
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const catalogKind = formData.get("catalogKind") === "DEPARTMENT" ? "DEPARTMENT" : "SUBCATEGORY";
  const parentSlug = catalogKind === "SUBCATEGORY" ? String(formData.get("parentSlug") || "") : null;
  if (!name) return { error: "请填写分类名称" };
  if (catalogKind === "SUBCATEGORY" && !(await getCatalogDepartment(parentSlug ?? undefined))) return { error: "请选择所属一级大类" };
  const duplicate = await prisma.category.findFirst({ where: { name, id: { not: id } } });
  if (duplicate) return { error: "该分类名称已存在" };
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return { error: "分类不存在" };
  if (current.catalogKind === "DEPARTMENT" && catalogKind !== "DEPARTMENT") {
    const childCount = await prisma.category.count({ where: { catalogKind: "SUBCATEGORY", parentSlug: current.slug } });
    if (childCount > 0) return { error: `该一级大类下还有 ${childCount} 个二级小类，无法改为二级类` };
  }
  await prisma.$transaction(async (tx) => {
    await tx.category.update({ where: { id }, data: { name, catalogKind, parentSlug } });
    if (catalogKind === "SUBCATEGORY") {
      await tx.product.updateMany({ where: { categoryId: id }, data: { departmentSlug: parentSlug, subcategoryName: name } });
    }
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

// ---------- Orders ----------

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { error: "无效的订单状态" };
  }
  await prisma.order.update({ where: { id: orderId }, data: { status, ...(status === "PAID" ? { paidAt: new Date() } : {}) } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function toggleUserDisabled(userId: string, disabled: boolean) {
  await requireAdmin();
  const session = await auth();
  if (!session?.user?.id) return { error: "登录状态已失效" };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { error: "用户不存在" };
  if (userId === session.user.id) return { error: "不能移除当前登录账号" };
  if (isOwnerRole(user.role)) return { error: "不能移除站长账号" };
  if (user.role === "ADMIN" && !isOwnerRole(session.user.role)) return { error: "只有站长可以移除管理员" };
  await prisma.user.update({ where: { id: userId }, data: { isDisabled: disabled } });
  if (disabled && session.user.role === "ADMIN") await notifyOwner("ADMIN_OPERATION", "管理员移除用户", `${session.user.name || session.user.email} 移除了用户账号`, "/admin/users");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserRole(userId: string, makeAdmin: boolean) {
  await requireAdmin();
  const session = await auth();
  if (!session?.user?.id) return { error: "登录状态已失效" };
  if (!isOwnerRole(session.user.role)) return { error: "只有站长可以管理管理员权限" };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isDisabled: true } });
  if (!user) return { error: "用户不存在" };
  if (userId === session.user.id) return { error: "不能修改当前登录账号的管理员角色" };
  if (makeAdmin && user.isDisabled) return { error: "请先恢复该用户账号" };
  if (user.role === "OWNER") return { error: "不能修改站长权限" };
  await prisma.user.update({ where: { id: userId }, data: { role: makeAdmin ? "ADMIN" : "USER" } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resolveRefund(orderId: string, approved: boolean, reply?: string) {
  await requireAdmin();
  const reviewer = await auth();
  if (!reviewer?.user?.id || !isAdminRole(reviewer.user.role)) return { error: "登录状态已失效" };
  const normalizedReply = reply?.trim();
  if (!approved && !normalizedReply) return { error: "请填写拒绝理由" };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.refundStatus !== "PENDING") return { error: "待处理的退款申请不存在" };
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { refundStatus: approved ? "APPROVED" : "REJECTED", refundReply: approved ? "管理员已同意售后申请" : normalizedReply?.slice(0, 300), status: approved ? "COMPLETED" : order.status, adminUnread: false, userUnread: true },
    });
    if (approved && order.refundType === "RETURN_REFUND") {
      for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    if (approved && order.paymentMethod === "BALANCE") {
      await tx.user.update({ where: { id: order.userId }, data: { balance: { increment: order.total } } });
    }
    await saveOrderReview(orderId, reviewer.user.name || reviewer.user.email || "管理员", reviewer.user.role, tx);
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/profile");
  return { ok: true };
}
