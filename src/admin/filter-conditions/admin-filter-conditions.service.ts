import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminFilterConditionsService {
  constructor(private prisma: PrismaService) {}

  async findAllTypes() {
    return this.prisma.filterConditionType.findMany({
      include: {
        filterConditions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.filterCondition.findMany({
      include: {
        type: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
