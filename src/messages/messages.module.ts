import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from '../config/database/database.module';
import { PermissionGuard } from '../auth/guards/permissions.guard';

@Module({
  imports:[
    DatabaseModule
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    PermissionGuard
  ],
})
export class MessagesModule {}
