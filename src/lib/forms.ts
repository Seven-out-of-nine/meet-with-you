export function textField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(textField(formData, name), 10);
  return Number.isFinite(value) ? value : fallback;
}

export function numberField(formData: FormData, name: string) {
  const raw = textField(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function safePath(value: string, fallback: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function withMessage(path: string, kind: "error" | "success", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(message)}`;
}
