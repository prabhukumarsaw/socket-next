import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/config/env";

/**
 * Cloudinary Configuration and Utilities
 * Handles media upload, transformation, and management
 */

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  resourceType?: "image" | "video" | "raw" | "auto";
  transformation?: any;
  publicId?: string;
  optimize?: boolean; // Enable optimization
  compression?: "auto" | "best" | "good" | "eco" | "low"; // Compression quality
  maxFileSize?: number; // Max file size in bytes (default: 1MB)
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Buffer | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. Please set CLOUDINARY environment variables.");
  }

  try {
    const uploadOptions: any = {
      folder: options.folder || "bawal-news",
      tags: options.tags || [],
      resource_type: options.resourceType || "auto",
    };

    // Add optimization for images
    if ((options.resourceType === "image" || options.resourceType === "auto") && options.optimize !== false) {
      // Cloudinary transformation array format
      uploadOptions.transformation = [
        { format: "auto" }, // Auto format (WebP when supported)
        { quality: "auto:good" }, // Good quality with automatic compression (~1MB target)
        { fetch_format: "auto" },
        { flags: ["progressive", "strip_profile"] }, // Progressive JPEG and remove metadata
      ];
      
      // Merge with custom transformations if provided
      if (options.transformation) {
        uploadOptions.transformation = Array.isArray(options.transformation)
          ? [...uploadOptions.transformation, ...options.transformation]
          : [...uploadOptions.transformation, options.transformation];
      }
    } else if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options.transformation && !defaultTransformation.length) {
      uploadOptions.transformation = options.transformation;
    }

    // Check file size before upload (for File objects)
    if (file instanceof File) {
      const maxSize = options.maxFileSize || 5 * 1024 * 1024; // Default 5MB
      if (file.size > maxSize) {
        throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
      }
    }

    let uploadResult: any;
    if (typeof file === "string") {
      // URL upload
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else if (file instanceof File) {
      // File upload - convert to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    } else {
      // Buffer upload
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    }

    return {
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      secureUrl: uploadResult.secure_url,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "jpg" | "png" | "webp";
    crop?: string;
  } = {}
): string {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }

  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  const transformString = transformations.length > 0 ? transformations.join(",") + "/" : "";

  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}${publicId}`;
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

export { cloudinary };

