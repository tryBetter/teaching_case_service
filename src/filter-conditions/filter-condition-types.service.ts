import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilterConditionTypeDto } from './dto/create-filter-condition-type.dto';
import { UpdateFilterConditionTypeDto } from './dto/update-filter-condition-type.dto';

@Injectable()
export class FilterConditionTypesService {
  constructor(private prisma: PrismaService) {}

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }

  async create(createFilterConditionTypeDto: CreateFilterConditionTypeDto) {
    try {
      return await this.prisma.filterConditionType.create({
        data: createFilterConditionTypeDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('筛选条件类型名称已存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.filterConditionType.findMany({
      include: {
        filterConditions: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const filterConditionType =
      await this.prisma.filterConditionType.findUnique({
        where: { id },
        include: {
          filterConditions: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
          },
        },
      });

    if (!filterConditionType) {
      throw new NotFoundException('筛选条件类型不存在');
    }

    return filterConditionType;
  }

  async update(
    id: number,
    updateFilterConditionTypeDto: UpdateFilterConditionTypeDto,
  ) {
    try {
      return await this.prisma.filterConditionType.update({
        where: { id },
        data: updateFilterConditionTypeDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('筛选条件类型名称已存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('筛选条件类型不存在');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.filterConditionType.delete({
        where: { id },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('筛选条件类型不存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2003') {
        throw new ConflictException('无法删除，该类型下还有筛选条件');
      }
      throw error;
    }
  }
}
