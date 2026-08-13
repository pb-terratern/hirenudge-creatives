import { isIP } from "node:net";

const permittedFiles: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

export function assertAllowedReferenceUrl(value: string): URL {
  const url = new URL(value);
  if (!(["http:", "https:"] as string[]).includes(url.protocol)) throw new Error("Only HTTP and HTTPS references are permitted.");
  const host = url.hostname.toLocaleLowerCase("en-US");
  if (host === "localhost" || host.endsWith(".local") || isPrivateIpv4(host) || isIP(host) === 6 && (host === "::1" || host.startsWith("fe80:"))) {
    throw new Error("Private-network reference URLs are not permitted.");
  }
  return url;
}

export function validateReferenceFile(file: { name: string; type: string; size: number }): { extension: string; size: number } {
  if (file.size > 20_000_000) throw new Error("Reference files must be 20 MB or smaller.");
  const extension = permittedFiles[file.type];
  if (!extension) throw new Error("Unsupported reference file type.");
  const nameExtension = file.name.split(".").pop()?.toLocaleLowerCase("en-US");
  if (!nameExtension || (extension === "jpg" ? !["jpg", "jpeg"].includes(nameExtension) : nameExtension !== extension)) {
    throw new Error("Reference file extension does not match its MIME type.");
  }
  return { extension, size: file.size };
}
