-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'activity',
ADD COLUMN     "targetCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "HabitLog" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1;
