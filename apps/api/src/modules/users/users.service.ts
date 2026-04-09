import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RoleKey } from '../../common/rbac/role';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailWithRoles(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  async findByIdWithRoles(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  toPublicUser(user: { id: string; email: string; roles: { role: { key: string } }[] }) {
    const roles = user.roles.map((ur) => ur.role.key as RoleKey);
    return { id: user.id, email: user.email, roles };
  }
}