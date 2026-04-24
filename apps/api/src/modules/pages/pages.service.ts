import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const BLOCKS_INCLUDE = { blocks: { orderBy: { order: 'asc' as const } } } as const;

function handleUniqueViolation(e: unknown, message: string): never {
  if ((e as any)?.code === 'P2002') throw new ConflictException(message);
  throw e;
}

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) { }

  async getActiveTheme() {
    // "active theme" = latest published
    const theme = await this.prisma.theme.findFirst({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return theme ?? null;
  }

  async ensureExists(id: string) {
    const p = await this.prisma.page.findUnique({ where: { id } })
    if (!p) throw new NotFoundException("Page not found")
    return p
  }

  async getPageModelById(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: BLOCKS_INCLUDE,
    })

    if (!page) throw new NotFoundException("Page not found")

    const theme = await this.getActiveTheme()

    return { page, theme }
  }

  async getPublishedPage(params: { slug: string; locale: string }) {
    const { slug, locale } = params;

    const page = await this.prisma.page.findFirst({
      where: { slug, locale, status: 'published' },
      include: BLOCKS_INCLUDE,
    });

    if (!page) throw new NotFoundException('Page not found');

    return page;
  }

  async listAdminPages(opts?: { skip?: number; take?: number }) {
    const skip = opts?.skip ?? 0;
    const take = opts?.take ?? 50;

    const [pages, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { blocks: true } },
          blocks: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
        },
        skip,
        take,
      }),
      this.prisma.page.count(),
    ]);

    return {
      items: pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        locale: p.locale,
        status: p.status,
        parentId: p.parentId ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        contentUpdatedAt: p.blocks[0]?.updatedAt ?? p.createdAt,
        publishedAt: p.publishedAt ?? null,
        blocksCount: p._count.blocks,
      })),
      total,
    };
  }

  async getAdminPageById(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: BLOCKS_INCLUDE,
    })

    if (!page) throw new NotFoundException("Page not found")
    return page
  }

  async updateBlockData(blockId: string, data: Record<string, any>) {
    await this.prisma.block.update({
      where: { id: blockId },
      data: { data },
    })
  }

  async publishPage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } })
    if (!page) throw new NotFoundException("Page not found")

    return this.prisma.page.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    })
  }

  async unpublishPage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } })
    if (!page) throw new NotFoundException("Page not found")

    return this.prisma.page.update({
      where: { id },
      data: {
        status: "draft",
        publishedAt: null,
      },
    })
  }

  async moveBlock(blockId: string, direction: "up" | "down") {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: { id: true, pageId: true, order: true },
    })
    if (!block) throw new NotFoundException("Block not found")

    const neighbor = await this.prisma.block.findFirst({
      where: {
        pageId: block.pageId,
        order: direction === "up" ? { lt: block.order } : { gt: block.order },
      },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
      select: { id: true, order: true },
    })

    if (!neighbor) return { moved: false }

    await this.prisma.$transaction([
      this.prisma.block.update({ where: { id: block.id }, data: { order: neighbor.order } }),
      this.prisma.block.update({ where: { id: neighbor.id }, data: { order: block.order } }),
    ])

    return { moved: true }
  }

  async createPage(input: { slug: string; locale: string }) {
    try {
      const page = await this.prisma.page.create({
        data: {
          slug: input.slug,
          locale: input.locale,
          status: "draft",
          seo: Prisma.DbNull,
        },
        select: { id: true, slug: true, locale: true, status: true, createdAt: true, updatedAt: true },
      })
      return page
    } catch (e) {
      handleUniqueViolation(e, "Page with this slug+locale already exists")
    }
  }

  async duplicatePage(sourceId: string) {
    const src = await this.prisma.page.findUnique({
      where: { id: sourceId },
      include: BLOCKS_INCLUDE,
    })
    if (!src) throw new NotFoundException("Page not found")

    // auto-slug: `${slug}-copy`, `${slug}-copy-2`, ...
    const base = `${src.slug}-copy`
    let slug = base
    let i = 2
    while (
      await this.prisma.page.findFirst({
        where: { slug, locale: src.locale },
        select: { id: true },
      })
    ) {
      slug = `${base}-${i++}`
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          slug,
          locale: src.locale,
          status: "draft",
          publishedAt: null,
          seo: src.seo ?? Prisma.DbNull,
        },
        select: { id: true, slug: true, locale: true, status: true },
      })

      if (src.blocks.length) {
        await tx.block.createMany({
          data: src.blocks.map((b) => ({
            pageId: page.id,
            type: b.type,
            variant: b.variant,
            order: b.order,
            data: b.data as any,
          })),
        })
      }

      return page
    })

    return created
  }

  async updatePage(
    id: string,
    dto: { slug?: string; settings?: Record<string, any>; parentId?: string | null },
  ) {
    const page = await this.prisma.page.findUnique({ where: { id } })
    if (!page) throw new NotFoundException("Page not found")

    if (dto.slug == null && dto.settings == null && dto.parentId === undefined) {
      throw new BadRequestException("Nothing to update")
    }

    const data: Record<string, any> = {}
    if (dto.slug != null) data.slug = dto.slug
    if (dto.settings != null) data.settings = dto.settings
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException("A page cannot be its own parent")
      // Guard against cycles
      if (dto.parentId) {
        let cursor: string | null = dto.parentId
        let steps = 0
        while (cursor && steps < 32) {
          if (cursor === id) throw new BadRequestException("Circular parent chain")
          const next: { parentId: string | null } | null = await this.prisma.page.findUnique({
            where: { id: cursor },
            select: { parentId: true },
          })
          cursor = next?.parentId ?? null
          steps++
        }
      }
      data.parentId = dto.parentId
    }

    try {
      return await this.prisma.page.update({
        where: { id },
        data,
        select: {
          id: true,
          slug: true,
          locale: true,
          status: true,
          settings: true,
          parentId: true,
          updatedAt: true,
        },
      })
    } catch (e) {
      handleUniqueViolation(e, "Page with this slug+locale already exists")
    }
  }

  async deletePage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id }, select: { id: true } })
    if (!page) throw new NotFoundException("Page not found")

    // безпечний варіант (навіть якщо в Prisma немає cascade)
    await this.prisma.$transaction([
      this.prisma.block.deleteMany({ where: { pageId: id } }),
      this.prisma.page.delete({ where: { id } }),
    ])

    return { ok: true }
  }

  async createBlock(pageId: string, input: { type: string; variant: string; data?: Record<string, any> }) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId }, select: { id: true } })
    if (!page) throw new NotFoundException("Page not found")

    const last = await this.prisma.block.findFirst({
      where: { pageId },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const nextOrder = (last?.order ?? 0) + 1

    const block = await this.prisma.block.create({
      data: {
        pageId,
        type: input.type,
        variant: input.variant,
        order: nextOrder,
        data: (input.data ?? {}) as any,
      },
      select: { id: true, pageId: true, type: true, variant: true, order: true, data: true },
    })

    return block
  }

  async deleteBlock(blockId: string) {
    // якщо нема — Prisma кине, але краще повідомлення:
    const b = await this.prisma.block.findUnique({ where: { id: blockId }, select: { id: true } })
    if (!b) throw new NotFoundException("Block not found")

    await this.prisma.block.delete({ where: { id: blockId } })
    return { ok: true }
  }
}