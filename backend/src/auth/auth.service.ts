import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type OtpRecord = {
  code: string;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  private otps = new Map<string, OtpRecord>();
  private identifierToUserId = new Map<string, string>();

  constructor(private prisma: PrismaService) {}

  requestOtp(data: { channel: 'phone' | 'email'; identifier: string }) {
    if (!data.identifier) {
      throw new BadRequestException('Identifier is required');
    }

    const code = String(randomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otps.set(data.identifier, { code, expiresAt });

    return {
      success: true,
      expiresAt,
      devCode: code,
    };
  }

  async verifyOtp(data: {
    identifier: string;
    code: string;
    role?: 'SELLER' | 'BUYER';
    name?: string;
  }) {
    const record = this.otps.get(data.identifier);

    if (!record || record.expiresAt < Date.now()) {
      throw new BadRequestException('OTP expired');
    }

    if (record.code !== data.code) {
      throw new BadRequestException('Invalid OTP');
    }

    let userId = this.identifierToUserId.get(data.identifier);

    if (!userId) {
      const user = await this.prisma.user.create({
        data: {
          role: data.role ?? 'BUYER',
          name: data.name ?? 'New User',
        },
      });
      const createdUserId = user.id;
      userId = createdUserId;
      this.identifierToUserId.set(data.identifier, createdUserId);
    }

    this.otps.delete(data.identifier);

    return {
      token: `mock-token-${userId}`,
      userId,
    };
  }
}
