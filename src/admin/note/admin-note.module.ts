import { Module } from '@nestjs/common';
import { AdminNoteController } from './admin-note.controller';
import { AdminNoteService } from './admin-note.service';
import { NoteModule } from '../../note/note.module';

@Module({
  imports: [NoteModule],
  controllers: [AdminNoteController],
  providers: [AdminNoteService],
})
export class AdminNoteModule {}
