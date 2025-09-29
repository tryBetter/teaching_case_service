import { Module } from '@nestjs/common';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { MediaModule } from '../../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [AdminMediaController],
  providers: [AdminMediaService],
})
export class AdminMediaModule {}
