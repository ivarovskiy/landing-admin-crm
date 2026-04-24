import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface GlobalBlockPayload {
  type?: string;
  variant?: string;
  data?: unknown;
}

const SUPPORTED_KEYS = ['header', 'footer'] as const;
export type GlobalBlockKey = (typeof SUPPORTED_KEYS)[number];

function isSupportedKey(key: string): key is GlobalBlockKey {
  return (SUPPORTED_KEYS as readonly string[]).includes(key);
}

/** parentId === null → site-wide default scope. Any page id → scoped to that page's subtree. */
type Scope = string | null;

@Injectable()
export class GlobalBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find one block for a given (scope, key) — returns null if not created yet. */
  async findOne(scope: Scope, key: string) {
    if (!isSupportedKey(key)) {
      throw new NotFoundException(`Unknown global block key: ${key}`);
    }
    return this.prisma.globalBlock.findFirst({
      where: { parentId: scope, key },
    });
  }

  /** Get-or-create for a given (scope, key). */
  async ensure(scope: Scope, key: string) {
    if (!isSupportedKey(key)) {
      throw new NotFoundException(`Unknown global block key: ${key}`);
    }
    const existing = await this.findOne(scope, key);
    if (existing) return existing;
    return this.prisma.globalBlock.create({
      data: {
        parentId: scope,
        key,
        type: key,
        variant: 'v1',
        data: {},
      },
    });
  }

  /** List all scopes (site-wide + each parent page that has at least one block). */
  async listScopes() {
    const rows = await this.prisma.globalBlock.findMany({
      select: { parentId: true },
      distinct: ['parentId'],
    });
    return rows.map((r) => r.parentId);
  }

  /** All blocks for a given scope, keyed by block.key */
  async getAllForScope(scope: Scope) {
    const rows = await this.prisma.globalBlock.findMany({
      where: { parentId: scope },
    });
    const map = new Map(rows.map((r) => [r.key, r]));
    const out: Record<string, unknown> = {};
    for (const key of SUPPORTED_KEYS) {
      out[key] = map.get(key) ?? null;
    }
    return out;
  }

  async update(scope: Scope, key: string, payload: GlobalBlockPayload) {
    if (!isSupportedKey(key)) {
      throw new NotFoundException(`Unknown global block key: ${key}`);
    }
    const existing = await this.findOne(scope, key);
    const patch: Record<string, unknown> = {};
    if (typeof payload.type === 'string') patch.type = payload.type;
    if (typeof payload.variant === 'string') patch.variant = payload.variant;
    if (payload.data !== undefined) patch.data = payload.data as object;

    if (existing) {
      return this.prisma.globalBlock.update({
        where: { id: existing.id },
        data: patch,
      });
    }
    return this.prisma.globalBlock.create({
      data: {
        parentId: scope,
        key,
        type: payload.type ?? key,
        variant: payload.variant ?? 'v1',
        data: (payload.data as object) ?? {},
      },
    });
  }

  /**
   * Walk from a page up the parent chain; return the most-specific non-null
   * match for each supported key, falling back to site-wide.
   */
  async resolveForPage(pageId: string) {
    const chain: string[] = [];
    let cursor: string | null = pageId;
    let steps = 0;
    while (cursor && steps < 16) {
      chain.push(cursor);
      const row = await this.prisma.page.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = row?.parentId ?? null;
      steps++;
    }

    const resolved: Record<string, unknown> = {
      header: null,
      footer: null,
    };

    // Walk from most specific (the page itself) up through ancestors
    for (const pid of chain) {
      if (resolved.header && resolved.footer) break;
      const rows = await this.prisma.globalBlock.findMany({
        where: { parentId: pid },
      });
      for (const r of rows) {
        if (!resolved[r.key]) resolved[r.key] = r;
      }
    }

    // Site-wide fallback
    if (!resolved.header || !resolved.footer) {
      const rows = await this.prisma.globalBlock.findMany({ where: { parentId: null } });
      for (const r of rows) {
        if (!resolved[r.key]) resolved[r.key] = r;
      }
    }

    return resolved;
  }
}
