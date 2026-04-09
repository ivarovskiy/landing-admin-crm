import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

/** Walk up from cwd until we find pnpm-workspace.yaml (monorepo root). */
function findMonorepoRoot(from: string): string {
  let dir = from;
  while (true) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return from; // fallback
    dir = parent;
  }
}

const UPLOADS_DIR = path.join(findMonorepoRoot(process.cwd()), "uploads");

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure uploads directory exists on startup. */
  onModuleInit() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  /** Save uploaded file to disk and create a MediaAsset record. */
  async upload(file: Express.Multer.File) {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${hash}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, file.buffer);

    const dimensions = this.parseImageDimensions(file.buffer, ext);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        url: `/uploads/${filename}`,
        providerKey: "local",
        mime: file.mimetype,
        size: file.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
      },
    });

    return asset;
  }

  /** List media assets (newest first). */
  async list(take = 50, skip = 0) {
    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.mediaAsset.count(),
    ]);
    return { items, total };
  }

  /** Delete a media asset by id (removes file + DB record). */
  async delete(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return { ok: false };

    // Remove file from disk
    const filePath = path.join(UPLOADS_DIR, path.basename(asset.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.mediaAsset.delete({ where: { id } });
    return { ok: true };
  }

  /** Basic image dimension parsing for PNG and JPEG. */
  private parseImageDimensions(
    buffer: Buffer,
    ext: string,
  ): { width: number; height: number } | null {
    try {
      // PNG: width at offset 16 (4 bytes BE), height at 20
      if (ext === ".png" && buffer.length > 24) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }

      // JPEG: scan for SOF0/SOF2 marker
      if ((ext === ".jpg" || ext === ".jpeg") && buffer.length > 2) {
        let offset = 2;
        while (offset < buffer.length - 8) {
          if (buffer[offset] !== 0xff) break;
          const marker = buffer[offset + 1];
          // SOF0 or SOF2
          if (marker === 0xc0 || marker === 0xc2) {
            return {
              height: buffer.readUInt16BE(offset + 5),
              width: buffer.readUInt16BE(offset + 7),
            };
          }
          const segLen = buffer.readUInt16BE(offset + 2);
          offset += 2 + segLen;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }
}
