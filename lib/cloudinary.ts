import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary environment variables are missing!', {
    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET,
  })
}

const ensureConfig = () => {
  const cloud_name = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  const cloudinary_url = String(process.env.CLOUDINARY_URL || '').trim();

  if (cloudinary_url) {
    cloudinary.config({ cloudinary_url });
  } else {
    cloudinary.config({ cloud_name, api_key, api_secret });
  }

  const config = cloudinary.config();
  if (!config.api_key) {
    console.error('❌ Cloudinary Config Failed. Diagnostic:', {
      has_url: !!cloudinary_url,
      has_name: !!cloud_name,
      has_key: !!api_key,
      key_length: api_key.length
    });
    throw new Error('Cloudinary configuration failed: api_key missing');
  }
}

export async function uploadDishImage(file: Buffer, dishName: string) {
  ensureConfig();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'royal-comfort/dishes',
        public_id: `${dishName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        transformation: [
          { width: 1600, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error || !result) {
            console.error('Cloudinary Stream Error:', error);
            return reject(error || new Error('Upload failed'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    );
    uploadStream.end(file);
  });
}

export async function deleteDishImage(publicId: string) {
  ensureConfig();
  return cloudinary.uploader.destroy(publicId)
}

export async function uploadRestaurantLogo(file: Buffer) {
  ensureConfig();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'royal-comfort/branding',
        public_id: 'restaurant-logo',
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    );
    uploadStream.end(file);
  })
}
