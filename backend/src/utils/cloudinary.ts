import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export interface CloudinaryResult {
  url: string;
  publicId: string;
  resourceType: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto' | 'raw';
    publicId?: string;
  } = {}
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'marcasnet',
        resource_type: options.resourceType || 'auto',
        ...(options.publicId ? { public_id: options.publicId } : {}),
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
          });
        }
      }
    );

    const readable = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });
    readable.pipe(stream);
  });
}

export async function deleteResource(publicId: string, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
}

export default cloudinary;
