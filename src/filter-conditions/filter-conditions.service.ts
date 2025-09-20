import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilterConditionDto } from './dto/create-filter-condition.dto';
import { UpdateFilterConditionDto } from './dto/update-filter-condition.dto';

@Injectable()
export class FilterConditionsService {
  constructor(private prisma: PrismaService) {}

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }

  async create(createFilterConditionDto: CreateFilterConditionDto) {
    try {
      return await this.prisma.filterCondition.create({
        data: createFilterConditionDto,
        include: {
          type: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('筛选条件名称已存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2003') {
        throw new NotFoundException('筛选条件类型不存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.filterCondition.findMany({
      include: {
        type: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(typeId: number) {
    return this.prisma.filterCondition.findMany({
      where: { typeId },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const filterCondition = await this.prisma.filterCondition.findUnique({
      where: { id },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        articles: {
          select: {
            article: {
              select: {
                id: true,
                title: true,
                published: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!filterCondition) {
      throw new NotFoundException('筛选条件不存在');
    }

    return filterCondition;
  }

  async update(id: number, updateFilterConditionDto: UpdateFilterConditionDto) {
    try {
      return await this.prisma.filterCondition.update({
        where: { id },
        data: updateFilterConditionDto,
        include: {
          type: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('筛选条件名称已存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('筛选条件不存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2003') {
        throw new NotFoundException('筛选条件类型不存在');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.filterCondition.delete({
        where: { id },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('筛选条件不存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2003') {
        throw new ConflictException('无法删除，该筛选条件还被文章使用');
      }
      throw error;
    }
  }
}
