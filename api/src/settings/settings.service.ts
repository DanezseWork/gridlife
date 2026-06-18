import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.$transaction(async (prisma) => {
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          ...(dto.baseColor !== undefined && { baseColor: dto.baseColor }),
          ...(dto.accentColor !== undefined && {
            accentColor: dto.accentColor,
          }),
          ...(dto.currency !== undefined && { currency: dto.currency }),
        },
        create: {
          userId,
          baseColor: dto.baseColor ?? '#000000',
          accentColor: dto.accentColor ?? '#ffffff',
          currency: dto.currency ?? 'PHP',
        },
      });

      return settings;
    });
  }
}
