-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "scheduleDays" JSONB;
