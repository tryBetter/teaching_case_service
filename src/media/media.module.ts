import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { AdminMediaService } from '../admin/media/admin-media.service';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [MediaController],
  providers: [MediaService, AdminMediaService],
  exports: [MediaService],
})
export class MediaModule {}
