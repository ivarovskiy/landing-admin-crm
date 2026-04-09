import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorUserId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    diff?: unknown;
  }) {
    const { actorUserId = null, diff, ...rest } = params;

    return this.prisma.auditLog.create({
      data: {
        actorUserId,
        ...rest,
        diff: diff ?? undefined,
      },
    });
  }
}