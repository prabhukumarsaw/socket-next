import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

/**
 * Local Storage Media Management System
 * Features:
 * - Filename sanitization
 * - Image compression with sharp
 * - Security validation (malicious file detection)
 * - File size limits (2MB)
 * - Blur placeholder generation
 */

// Allowed MIME types and extensions
const ALLOWED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
} as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const STORAGE_DIR = "storage/media";
const THUMBNAIL_DIR = "storage/thumbnails";

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  quality?: number; // 1-100, default 80
  maxWidth?: number; // Max width for resizing
  maxHeight?: number; // Max height for resizing
  generateBlur?: boolean; // Generate blur placeholder
}

export interface LocalUploadResult {
  filename: string;
  originalName: string;
  url: string; // Relative URL for DB storage
  format: string;
  mimeType: string;
  bytes: number;
  width?: number;
  height?: number;
  blurDataUrl?: string; // Base64 blur placeholder
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  
  // Remove special characters, keep only alphanumeric, dash, underscore, dot
  const sanitized = basename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  // Ensure filename is not empty
  if (!sanitized || sanitized === ".") {
    return `file-${Date.now()}`;
  }
  
  return sanitized;
}

/**
 * Generate unique filename with timestamp and random hash
 */
export function generateUniqueFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const hash = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  
  return `${name}-${timestamp}-${hash}${ext}`;
}

/**
 * Validate file type by checking magic bytes (file signature)
 */
async function validateFileSignature(buffer: Buffer, mimeType: string): Promise<boolean> {
  const signatures: Record<string, number[][]> = {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    "image/svg+xml": [], // SVG is text-based, validate differently
  };

  // For SVG, check for XML/SVG content
  if (mimeType === "image/svg+xml") {
    const content = buffer.toString("utf8", 0, Math.min(1000, buffer.length));
    const hasSvgTag = content.includes("<svg") || content.includes("<?xml");
    // Security: Check for malicious content in SVG
    const hasMalicious = 
      content.includes("<script") || 
      content.includes("javascript:") ||
      content.includes("on") && /on\w+\s*=/.test(content);
    return hasSvgTag && !hasMalicious;
  }

  const validSignatures = signatures[mimeType];
  if (!validSignatures || validSignatures.length === 0) {
    return false;
  }

  return validSignatures.some((sig) => {
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

/**
 * Check for malicious content in file
 */
async function checkMaliciousContent(buffer: Buffer): Promise<boolean> {
  const content = buffer.toString("utf8", 0, Math.min(10000, buffer.length));
  
  // Check for embedded scripts or PHP
  const maliciousPatterns = [
    /<\?php/i,
    /<script/i,
    /javascript:/i,
    /eval\s*\(/i,
    /base64_decode/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  return !maliciousPatterns.some((pattern) => pattern.test(content));
}

/**
 * Generate blur placeholder using sharp
 */
async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
  try {
    const blurBuffer = await sharp(buffer)
      .resize(10, 10, { fit: "inside" })
      .blur()
      .toBuffer();
    
    return `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;
  } catch {
    return "";
  }
}

/**
 * Ensure storage directories exist
 */
async function ensureStorageDir(subdir?: string): Promise<string> {
  const baseDir = path.join(process.cwd(), "public", STORAGE_DIR);
  const targetDir = subdir ? path.join(baseDir, subdir) : baseDir;
  
  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
}

/**
 * Upload and process file to local storage
 */
export async function uploadToLocalStorage(
  file: File | Buffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<LocalUploadResult> {
  // Convert File to Buffer if needed
  let buffer: Buffer;
  let mimeType: string;
  
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = file.type;
  } else {
    buffer = file;
    // Detect mime type from extension
    const ext = path.extname(originalName).toLowerCase();
    mimeType = Object.entries(ALLOWED_TYPES).find(([, exts]) => 
      exts.includes(ext as never)
    )?.[0] || "application/octet-stream";
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (2MB)`);
  }

  // Validate MIME type
  if (!Object.keys(ALLOWED_TYPES).includes(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed. Allowed types: jpg, jpeg, png, webp, gif, svg`);
  }

  // Validate file signature (magic bytes)
  const isValidSignature = await validateFileSignature(buffer, mimeType);
  if (!isValidSignature) {
    throw new Error("File content does not match its extension. Possible malicious file detected.");
  }

  // Check for malicious content
  const isSafe = await checkMaliciousContent(buffer);
  if (!isSafe) {
    throw new Error("Potentially malicious content detected in file.");
  }

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(originalName);
  const ext = path.extname(uniqueFilename).toLowerCase();
  
  // Process image with sharp (skip SVG)
  let processedBuffer = buffer;
  let metadata: sharp.Metadata | null = null;
  let blurDataUrl = "";

  if (mimeType !== "image/svg+xml") {
    try {
      const image = sharp(buffer);
      metadata = await image.metadata();

      // Resize if needed
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;
      
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          image.resize(maxWidth, maxHeight, { 
            fit: "inside",
            withoutEnlargement: true 
          });
        }
      }

      // Compress based on format
      const quality = options.quality || 80;
      
      if (mimeType === "image/jpeg") {
        image.jpeg({ quality, progressive: true });
      } else if (mimeType === "image/png") {
        image.png({ quality, compressionLevel: 9 });
      } else if (mimeType === "image/webp") {
        image.webp({ quality });
      } else if (mimeType === "image/gif") {
        // GIF: just pass through, sharp has limited GIF support
      }

      // Strip metadata for security
      image.rotate(); // Auto-rotate based on EXIF, then remove EXIF

      processedBuffer = await image.toBuffer();
      
      // Update metadata after processing
      const processedMeta = await sharp(processedBuffer).metadata();
      metadata = processedMeta;

      // Generate blur placeholder
      if (options.generateBlur !== false) {
        blurDataUrl = await generateBlurPlaceholder(processedBuffer);
      }
    } catch (error) {
      console.error("Sharp processing error:", error);
      // Fall back to original buffer if processing fails
      processedBuffer = buffer;
    }
  }

  // Ensure storage directory exists
  const folder = options.folder ? sanitizeFilename(options.folder) : "";
  const storageDir = await ensureStorageDir(folder);
  
  // Write file
  const filePath = path.join(storageDir, uniqueFilename);
  await fs.writeFile(filePath, processedBuffer);

  // Generate relative URL for database storage
  const relativeUrl = `/${STORAGE_DIR}${folder ? `/${folder}` : ""}/${uniqueFilename}`;

  return {
    filename: uniqueFilename,
    originalName: sanitizeFilename(originalName),
    url: relativeUrl,
    format: ext.replace(".", ""),
    mimeType,
    bytes: processedBuffer.length,
    width: metadata?.width,
    height: metadata?.height,
    blurDataUrl,
  };
}

/**
 * Delete file from local storage
 */
export async function deleteFromLocalStorage(relativeUrl: string): Promise<void> {
  // Validate the URL to prevent path traversal
  if (!relativeUrl.startsWith(`/${STORAGE_DIR}/`)) {
    throw new Error("Invalid file path");
  }

  const filePath = path.join(process.cwd(), "public", relativeUrl);
  
  // Ensure the path is within the storage directory
  const normalizedPath = path.normalize(filePath);
  const storageBase = path.normalize(path.join(process.cwd(), "public", STORAGE_DIR));
  
  if (!normalizedPath.startsWith(storageBase)) {
    throw new Error("Invalid file path - path traversal detected");
  }

  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist, that's fine
  }
}

/**
 * Get file info from local storage
 */
export async function getFileInfo(relativeUrl: string): Promise<{
  exists: boolean;
  size?: number;
  mtime?: Date;
}> {
  if (!relativeUrl.startsWith(`/${STORAGE_DIR}/`)) {
    return { exists: false };
  }

  const filePath = path.join(process.cwd(), "public", relativeUrl);

  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Check if local storage is configured properly
 */
export function isLocalStorageConfigured(): boolean {
  return true; // Local storage is always available
}

