import { z } from "zod";
import { normalizeProductImageUrl } from "@/lib/product-images";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "请输入昵称").max(60),
  email: z.string().trim().email("请输入有效的邮箱"),
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入有效的 11 位手机号码"),
  password: z.string().min(6, "密码至少需要 6 个字符").max(100),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "请输入邮箱或手机号码"),
  password: z.string().min(1, "请输入密码"),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "请输入商品名称").max(120),
  description: z.string().trim().max(1000, "商品描述不能超过 1000 个字符"),
  // price entered in yuan in the form; converted to cents before persisting
  price: z.coerce.number().positive("价格必须大于 0"),
  imageUrl: z.string().trim().min(1, "请输入图片路径").transform(normalizeProductImageUrl).refine(
    (value) => /^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value),
    "请输入 /products/...、/public/products/... 或 http/https 图片链接"
  ),
  stock: z.coerce.number().int().min(0, "库存不能为负数"),
  categoryId: z.string().min(1, "请选择分类"),
  departmentSlug: z.string().min(1, "请选择首页大类"),
  subcategoryName: z.string().min(1, "请选择商品小类"),
  isActive: z.preprocess(
    (value) => value === "on" || value === "true",
    z.boolean()
  ),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "请输入分类名称").max(60),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "请输入收货人姓名").max(80),
  address: z.string().trim().min(1, "请输入收货地址").max(200),
  phone: z.string().trim().min(1, "请输入联系电话").max(30),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
