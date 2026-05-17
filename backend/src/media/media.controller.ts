import { Body, Controller, Post } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  getUploadUrl(@Body() data?: { folder?: string; publicId?: string; tags?: string[] }) {
    return this.mediaService.getUploadSignature(data);
  }

  @Post('upload-signature')
  getUploadSignature(@Body() data?: { folder?: string; publicId?: string; tags?: string[] }) {
    return this.mediaService.getUploadSignature(data);
  }
}
