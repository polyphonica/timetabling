import { mkdirSync } from "fs";

function resolveUploadsDir(): string {
  const dir = process.env.UPLOADS_DIR;
  if (!dir) {
    throw new Error("UPLOADS_DIR is not set");
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const UPLOADS_DIR = resolveUploadsDir();
