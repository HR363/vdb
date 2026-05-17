import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body()
    data: {
      role: string;
      name: string;
      avatarUrl?: string;
      bio?: string;
      city?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return this.usersService.createUser(data);
  }

  @Get()
  async listUsers(@Query('role') role?: string) {
    return this.usersService.listUsers(role);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      avatarUrl?: string;
      bio?: string;
      city?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    return this.usersService.updateUser(id, data);
  }
}
