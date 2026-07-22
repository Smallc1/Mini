import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, { extension: string; signature: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": { extension: "jpg", signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: "png", signature: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (b) => textAt(b, 0, 4) === "RIFF" && textAt(b, 8, 4) === "WEBP" },
  "image/gif": { extension: "gif", signature: (b) => textAt(b, 0, 3) === "GIF" },
};

export async function saveProductImage(file: File): Promise<string> {
  const imageType = IMAGE_TYPES[file.type.toLowerCase()];
  if (!imageType) throw new Error("仅支持 JPG、PNG、WebP 或 GIF 图片");
  if (file.size === 0) throw new Error("请选择要上传的图片");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("图片不能超过 5MB");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageType.signature(bytes)) throw new Error("图片文件内容与格式不匹配");

  await mkdir(productUploadDirectory(), { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}.${imageType.extension}`;
  await writeFile(path.join(productUploadDirectory(), filename), bytes, { flag: "wx" });
  return `/uploads/products/${filename}`;
}

export async function readProductImage(filename: string): Promise<Buffer> {
  if (!/^[a-zA-Z0-9.-]+$/.test(filename)) throw new Error("Invalid image filename");
  return readFile(path.join(productUploadDirectory(), filename));
}

export async function removeProductImage(imageUrl: string): Promise<void> {
  const match = imageUrl.match(/^\/uploads\/products\/([a-zA-Z0-9.-]+)$/);
  if (!match) return;
  await unlink(path.join(productUploadDirectory(), match[1])).catch(() => undefined);
}

export function productImageContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" })[extension] ?? "application/octet-stream";
}

function productUploadDirectory(): string {
  return process.env.PRODUCT_UPLOAD_DIR || path.join(process.cwd(), "data", "product-uploads");
}

function textAt(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}
