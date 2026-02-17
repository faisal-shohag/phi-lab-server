import cloudinary from "../../config/cloudinary";
import { UploadImageOptions } from "./upload.interface";
import { Readable } from 'stream';
import { extractPublicId } from 'cloudinary-build-url'

export const uploadImageToCloudinary = async ({
  file,
  folder,
}: UploadImageOptions) => {
  try {
    let uploadFile:any = file;

    // If file is a base64 data URL, convert it to a stream
    if (typeof file === 'string' && file.startsWith('data:image')) {
      const base64Data = file.split(',')[1]; // Extract base64 part after comma
      
      if (!base64Data) {
        throw new Error('Could not decode base64');
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      uploadFile = Readable.from(buffer);
    }

    // Use upload_stream for stream/buffer uploads
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload failed:', error);
            reject(new Error('Image upload failed'));
          } else {
            // console.log('Cloudinary upload result:', result);
            resolve({ ...result });
          }
        }
      );

      // If uploadFile is a stream, pipe it; otherwise assume it's a file path
      if (typeof uploadFile === 'string') {
        // It's a file path - use the regular upload method
        cloudinary.uploader.upload(uploadFile, {
          folder,
          resource_type: 'image',
        }, (error, result) => {
          if (error) {
            console.error('Cloudinary upload failed:', error);
            reject(new Error('Image upload failed'));
          } else {
            // console.log('Cloudinary upload result:', result);
            resolve({ ...result });
          }
        });
      } else {
        // It's a stream - pipe it
        uploadFile.pipe(uploadStream);
      }
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error('Image upload failed');
  }
};


export const uploadProfileImageToCloudinary = async ({
  file,
  folder,
  previousImageURL,
}: UploadImageOptions) => {
  try {
    let uploadFile:any = file;

    if(previousImageURL) {
      const public_id = extractPublicId(previousImageURL)
      await cloudinary.uploader.destroy(public_id)
    }

    // If file is a base64 data URL, convert it to a stream
    if (typeof file === 'string' && file.startsWith('data:image')) {
      const base64Data = file.split(',')[1]; // Extract base64 part after comma
      
      if (!base64Data) {
        throw new Error('Could not decode base64');
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      uploadFile = Readable.from(buffer);
    }

    // Use upload_stream for stream/buffer uploads
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload failed:', error);
            reject(new Error('Image upload failed'));
          } else {
            // console.log('Cloudinary upload result:', result);
            resolve({ ...result });
          }
        }
      );

      // If uploadFile is a stream, pipe it; otherwise assume it's a file path
      if (typeof uploadFile === 'string') {
        // It's a file path - use the regular upload method
        cloudinary.uploader.upload(uploadFile, {
          folder,
          resource_type: 'image',
        }, (error, result) => {
          if (error) {
            console.error('Cloudinary upload failed:', error);
            reject(new Error('Image upload failed'));
          } else {
            // console.log('Cloudinary upload result:', result);
            resolve({ ...result });
          }
        });
      } else {
        // It's a stream - pipe it
        uploadFile.pipe(uploadStream);
      }
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error('Image upload failed');
  }
};

export const getImagesByFolder = async (
  folder: string,
  maxResults = 20
) => {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by("created_at", "desc")
      .max_results(maxResults)
      .execute();

    return result.resources.map((img: any) => ({
      publicId: img.public_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      format: img.format,
      createdAt: img.created_at,
    }));
  } catch (error) {
    console.error("Fetching images failed:", error);
    throw new Error("Failed to fetch images");
  }
};


export const deleteImageFromCloudinary = async (
  publicId: string
) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      throw new Error("Image not found or already deleted");
    }

    return true;
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    throw new Error("Failed to delete image");
  }
};

export const UploadServices = {
    uploadImageToCloudinary,
    getImagesByFolder,
    deleteImageFromCloudinary,
    uploadProfileImageToCloudinary
}