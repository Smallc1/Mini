import { readProductImage, productImageContentType } from "@/lib/product-image-storage";

type Params = Promise<{ filename: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { filename } = await params;
  try {
    const image = await readProductImage(filename);
    return new Response(image, {
      headers: {
        "Content-Type": productImageContentType(filename),
        "Content-Length": String(image.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
