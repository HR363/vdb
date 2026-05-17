import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(
    @Body()
    data: {
      sellerId: string;
      mediaUrls: string[] | string;
      collageType: string;
      title: string;
      description?: string;
      price: number;
      category: string;
      stockStatus: string;
      lat?: number;
      lng?: number;
      areaLabel?: string;
    },
  ) {
    return this.postsService.createPost(data);
  }

  @Get()
  async getFeed(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('sellerId') sellerId?: string,
    @Query('city') city?: string,
  ) {
    return this.postsService.getFeed({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      category,
      stockStatus,
      sellerId,
      city,
    });
  }

  @Get('nearby')
  async getNearbyPosts(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.postsService.getFeed({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
    });
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postsService.getPost(id);
  }
}
