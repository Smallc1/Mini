export const isAdminRole = (role?: string | null) => role === "ADMIN" || role === "OWNER";
export const isOwnerRole = (role?: string | null) => role === "OWNER";
