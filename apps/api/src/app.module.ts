import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { existsSync } from 'fs';

/** Walk up from cwd until we find pnpm-workspace.yaml (monorepo root). */
function findMonorepoRoot(from: string): string {
  let dir = from;
  while (true) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = join(dir, '..');
    if (parent === dir) return from;
    dir = parent;
  }
}

const MONOREPO_ROOT = findMonorepoRoot(process.cwd());

import { PrismaModule } from '../prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { PagesModule } from './modules/pages/pages.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded files at /uploads/*
    ServeStaticModule.forRoot({
      rootPath: join(MONOREPO_ROOT, 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),

    PrismaModule,
    HealthModule,
    AuditModule,
    PagesModule,
    UsersModule,
    AuthModule,
    MediaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
