import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { RoleKey } from './role';

type RequestUser = {
  id: string;
  email: string;
  roles: RoleKey[];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleKey[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Якщо ролі не вказані — доступ відкритий
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;

    // Поки Auth ще не зробили — на protected endpoints буде 403
    if (!user || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const ok = required.some((r) => user.roles.includes(r));
    if (!ok) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}