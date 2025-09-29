import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminHotSearchService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.hotSearch.findMany({
      orderBy: [{ clickCount: 'desc' }],
    });
  }

  async create(createHotSearchDto: any) {
    return this.prisma.hotSearch.create({
      data: createHotSearchDto,
    });
  }

  async update(id: number, updateHotSearchDto: any) {
    return this.prisma.hotSearch.update({
      where: { id },
      data: updateHotSearchDto,
    });
  }

  async remove(id: number) {
    return this.prisma.hotSearch.delete({
      where: { id },
    });
  }
}
