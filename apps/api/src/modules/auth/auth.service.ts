import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { getJwtExpiresIn } from '../../common/jwt-expires';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithRoles(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'active') throw new UnauthorizedException('User disabled');

    const publicUser = this.users.toPublicUser(user);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id },
      { expiresIn: getJwtExpiresIn() },
    );

    return { accessToken, user: publicUser };
  }
}