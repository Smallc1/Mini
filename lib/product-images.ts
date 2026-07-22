export function normalizeProductImageUrl(value: string): string {
  const input = value.trim().replaceAll("\\", "/");

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      url.pathname = stripPublicPrefix(url.pathname);
      return url.toString();
    } catch {
      return input;
    }
  }

  const withLeadingSlash = input.startsWith("/") ? input : `/${input}`;
  return stripPublicPrefix(withLeadingSlash);
}

export function isRemoteProductImage(value: string): boolean {
  return /^https?:\/\//i.test(normalizeProductImageUrl(value));
}

function stripPublicPrefix(pathname: string): string {
  return pathname.replace(/^\/public(?=\/|$)/i, "") || "/";
}
