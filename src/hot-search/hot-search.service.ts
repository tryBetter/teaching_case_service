import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotSearchDto } from './dto/create-hot-search.dto';
import { UpdateHotSearchDto } from './dto/update-hot-search.dto';

@Injectable()
export class HotSearchService {
  constructor(private prisma: PrismaService) {}

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    );
  }

  async create(createHotSearchDto: CreateHotSearchDto) {
    try {
      return await this.prisma.hotSearch.create({
        data: createHotSearchDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('热搜关键词已存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.hotSearch.findMany({
      orderBy: [
        { order: 'desc' },
        { clickCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findActive() {
    return this.prisma.hotSearch.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'desc' },
        { clickCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: number) {
    const hotSearch = await this.prisma.hotSearch.findUnique({
      where: { id },
    });

    if (!hotSearch) {
      throw new NotFoundException('热搜词条不存在');
    }

    return hotSearch;
  }

  async update(id: number, updateHotSearchDto: UpdateHotSearchDto) {
    try {
      return await this.prisma.hotSearch.update({
        where: { id },
        data: updateHotSearchDto,
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException('热搜关键词已存在');
      }
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('热搜词条不存在');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.hotSearch.delete({
        where: { id },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('热搜词条不存在');
      }
      throw error;
    }
  }

  async incrementClickCount(id: number) {
    try {
      return await this.prisma.hotSearch.update({
        where: { id },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      });
    } catch (error: any) {
      if (this.isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException('热搜词条不存在');
      }
      throw error;
    }
  }
}
