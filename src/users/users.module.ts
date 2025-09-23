import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ExcelService } from './services/excel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersService, ExcelService],
})
export class UsersModule {}
