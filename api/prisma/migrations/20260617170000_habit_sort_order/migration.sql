-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) - 1 AS new_order
  FROM "Habit"
  WHERE "archivedAt" IS NULL
)
UPDATE "Habit" h
SET "sortOrder" = o.new_order
FROM ordered o
WHERE h.id = o.id;
