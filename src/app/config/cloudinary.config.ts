/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import status from "http-status";
import { envVars } from "./env.js";
import AppError from "../../utils/appError.js";

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

/**
 * Upload file (PDF / Image)
 * Used for: invoices (PDF), event images, etc.
 */
export const uploadFileToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse> => {
  if (!buffer || !fileName) {
    throw new AppError(
      status.BAD_REQUEST,
      "File buffer and file name are required"
    );
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  // ✅ Clean filename
  const fileNameWithoutExtension = fileName
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const uniqueName =
    Math.random().toString(36).substring(2) +
    "-" +
    Date.now() +
    "-" +
    fileNameWithoutExtension;

  // ✅ Folder based on type (important for your system)
  let folder = "misc";

  if (extension === "pdf") {
    folder = "invoices"; // ✅ for Payment invoices
  } else {
    folder = "event-images"; // ✅ for Event images
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          public_id: `event-system/${folder}/${uniqueName}`,
          folder: `event-system/${folder}`,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(
              new AppError(
                status.INTERNAL_SERVER_ERROR,
                "Failed to upload file to Cloudinary"
              )
            );
          }

          resolve(result as UploadApiResponse);
        }
      )
      .end(buffer);
  });
};

/**
 * Delete file from Cloudinary using URL
 */
export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];

      await cloudinary.uploader.destroy(publicId, {
        resource_type: "auto", // ✅ supports pdf + image
      });

      console.log(`✅ File ${publicId} deleted from Cloudinary`);
    }
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to delete file from Cloudinary"
    );
  }
};

// Export instance if needed elsewhere
export const cloudinaryUpload = cloudinary;