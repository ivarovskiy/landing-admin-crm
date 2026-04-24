-- Page tree (parentId self-reference)
ALTER TABLE "Page" ADD COLUMN "parentId" TEXT;

ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Page_parentId_idx" ON "Page"("parentId");

-- GlobalBlock scoping: nullable parentId + drop unique(key), add (parentId,key) index
DROP INDEX "GlobalBlock_key_key";

ALTER TABLE "GlobalBlock" ADD COLUMN "parentId" TEXT;

ALTER TABLE "GlobalBlock" ADD CONSTRAINT "GlobalBlock_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "GlobalBlock_parentId_key_idx" ON "GlobalBlock"("parentId", "key");

-- Enforce single site-wide default (parentId IS NULL) per key via partial unique index
CREATE UNIQUE INDEX "GlobalBlock_sitewide_key_key" ON "GlobalBlock"("key") WHERE "parentId" IS NULL;

-- Enforce single per-parent per-key
CREATE UNIQUE INDEX "GlobalBlock_parent_key_key" ON "GlobalBlock"("parentId", "key") WHERE "parentId" IS NOT NULL;
