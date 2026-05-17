import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';

@ApiTags('public')
@Controller({ path: 'public/pages', version: '1' })
export class PublicPagesController {
  constructor(private readonly pages: PagesService) {}

  @Get(':slug')
  async getPublishedPage(
    @Param('slug') slug: string,
  ) {
    const page = await this.pages.getPublishedPage({ slug });

    const theme = await this.pages.getActiveTheme();

    return { page, theme };
  }
}