import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  requestOtp(@Body() data: { channel: 'phone' | 'email'; identifier: string }) {
    return this.authService.requestOtp(data);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body()
    data: {
      identifier: string;
      code: string;
      role?: 'SELLER' | 'BUYER';
      name?: string;
    },
  ) {
    return this.authService.verifyOtp(data);
  }
}
