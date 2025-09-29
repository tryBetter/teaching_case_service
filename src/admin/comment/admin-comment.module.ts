import { Module } from '@nestjs/common';
import { AdminCommentController } from './admin-comment.controller';
import { AdminCommentService } from './admin-comment.service';
import { CommentModule } from '../../comment/comment.module';

@Module({
  imports: [CommentModule],
  controllers: [AdminCommentController],
  providers: [AdminCommentService],
})
export class AdminCommentModule {}
