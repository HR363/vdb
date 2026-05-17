import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class MediaService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  getUploadSignature(data?: { folder?: string; publicId?: string; tags?: string[] }) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary env vars missing');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = { timestamp };

    if (data?.folder) {
      params.folder = data.folder;
    }

    if (data?.publicId) {
      params.public_id = data.publicId;
    }

    if (data?.tags?.length) {
      params.tags = data.tags.join(',');
    }

    const signature = cloudinary.utils.api_sign_request(params, apiSecret);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: data?.folder,
      publicId: data?.publicId,
      tags: data?.tags ?? [],
    };
  }
}
