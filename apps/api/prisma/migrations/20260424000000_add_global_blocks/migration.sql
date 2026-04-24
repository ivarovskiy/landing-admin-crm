-- CreateTable
CREATE TABLE "GlobalBlock" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalBlock_key_key" ON "GlobalBlock"("key");

-- Seed empty header + footer entries
INSERT INTO "GlobalBlock" ("id", "key", "type", "variant", "data", "updatedAt")
VALUES
  ('gb_header', 'header', 'header', 'v1', '{}'::jsonb, CURRENT_TIMESTAMP),
  ('gb_footer', 'footer', 'footer', 'v1', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
