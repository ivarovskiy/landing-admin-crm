import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"

type PreviewPayload = { sub: string; typ: "preview" }

@Injectable()
export class PreviewTokenService {
  constructor(private readonly jwt: JwtService) {}

  private getSecret() {
    const secret = process.env.PREVIEW_TOKEN_SECRET
    if (!secret) throw new Error("PREVIEW_TOKEN_SECRET is not set")
    return secret
  }

  create(pageId: string) {
    const ttl = Number(process.env.PREVIEW_TOKEN_TTL_SECONDS ?? "3600")
    const secret = this.getSecret()

    const token = this.jwt.sign(
      { sub: pageId, typ: "preview" } satisfies PreviewPayload,
      { secret, expiresIn: ttl },
    )

    return { token, expiresAt: new Date(Date.now() + ttl * 1000).toISOString() }
  }

  verify(token: string, pageId: string) {
    const secret = this.getSecret()

    try {
      const payload = this.jwt.verify<PreviewPayload>(token, { secret })
      if (payload.typ !== "preview") throw new UnauthorizedException("Invalid preview token")
      if (payload.sub !== pageId) throw new UnauthorizedException("Preview token does not match page")
      return payload
    } catch {
      throw new UnauthorizedException("Invalid or expired preview token")
    }
  }
}