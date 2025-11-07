import { Buffer } from "buffer";

// URL-safe base64 with UTF-8 support
export function toBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const utf8 = new TextEncoder().encode(json);
  const b64 =
    typeof window === "undefined"
      ? Buffer.from(utf8).toString("base64")
      : btoa(String.fromCharCode(...utf8));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64Url<T>(str: string): T | null {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
    const bin =
      typeof window === "undefined" ? Buffer.from(b64, "base64").toString("binary") : atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
