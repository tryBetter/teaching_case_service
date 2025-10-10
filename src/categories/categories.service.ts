import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: createCategoryDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('分类名称已存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('分类名称已存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('分类不存在');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('分类不存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2003') {
        throw new ConflictException('无法删除，该分类下还有文章');
      }
      throw error;
    }
  }
}
