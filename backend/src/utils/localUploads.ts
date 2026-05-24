import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveMaintenanceEvidenceFile(
  maintenanceId: string,
  file: { buffer: Buffer; originalname: string; mimetype?: string }
): { fileUrl: string; fileName: string } {
  const dir = path.join(UPLOAD_ROOT, "maintenance");
  ensureDir(dir);

  const ext =
    path.extname(file.originalname) ||
    (file.mimetype?.includes("png") ? ".png" : file.mimetype?.includes("webp") ? ".webp" : ".jpg");
  const safeName = `${maintenanceId}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const fullPath = path.join(dir, safeName);
  fs.writeFileSync(fullPath, file.buffer);

  const fileUrl = `/api/v1/uploads/maintenance/${safeName}`;
  return { fileUrl, fileName: file.originalname || safeName };
}

export function saveMaintenanceEvidenceBase64(
  maintenanceId: string,
  fileBase64: string,
  fileName: string,
  mimeType?: string
): { fileUrl: string; fileName: string } {
  const buffer = Buffer.from(fileBase64, "base64");
  return saveMaintenanceEvidenceFile(maintenanceId, {
    buffer,
    originalname: fileName,
    mimetype: mimeType,
  });
}

export const uploadsRoot = UPLOAD_ROOT;
