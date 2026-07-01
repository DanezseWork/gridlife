-- CreateTable
CREATE TABLE "HabitDaySkip" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitDaySkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HabitDaySkip_habitId_date_key" ON "HabitDaySkip"("habitId", "date");

-- CreateIndex
CREATE INDEX "HabitDaySkip_date_idx" ON "HabitDaySkip"("date");

-- AddForeignKey
ALTER TABLE "HabitDaySkip" ADD CONSTRAINT "HabitDaySkip_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
