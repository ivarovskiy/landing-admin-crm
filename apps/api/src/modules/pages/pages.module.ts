import { Module } from '@nestjs/common';
import { JwtModule } from "@nestjs/jwt"
import { PublicPagesController } from './public-pages.controller';
import { AdminPagesController } from './admin-pages.controller';
import { PagesService } from './pages.service';
import { PreviewTokenService } from "./preview-token.service"
import { PublicPreviewController } from './public-preview.controller';
import { AdminBlocksController } from './admin-blocks.controller';

@Module({
   imports: [
    // ...
    JwtModule.register({
      secret: process.env.PREVIEW_TOKEN_SECRET,
    }),
  ],
  controllers: [PublicPagesController, AdminPagesController, PublicPreviewController, AdminBlocksController],
  providers: [PagesService, PreviewTokenService],
})
export class PagesModule {}