import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../../categories/categories.service';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../categories/dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) {}

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
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    await this.categoriesService.remove(id);

    return {
      id: category.id,
      name: category.name,
      message: '分类删除成功',
    };
  }
}
