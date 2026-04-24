import { Module } from '@nestjs/common';
import { GlobalBlocksController } from './global-blocks.controller';
import { GlobalBlocksService } from './global-blocks.service';

@Module({
  controllers: [GlobalBlocksController],
  providers: [GlobalBlocksService],
  exports: [GlobalBlocksService],
})
export class GlobalBlocksModule {}
