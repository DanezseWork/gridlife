-- CreateTable
CREATE TABLE "PlannedTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "fromWalletId" TEXT,
    "toWalletId" TEXT,
    "kind" TEXT NOT NULL,
    "scheduledDate" DATE,
    "frequency" TEXT,
    "scheduleDays" JSONB,
    "startDate" DATE,
    "endDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedOccurrence" (
    "id" TEXT NOT NULL,
    "plannedTransactionId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlannedOccurrence_transactionId_key" ON "PlannedOccurrence"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedOccurrence_plannedTransactionId_dueDate_key" ON "PlannedOccurrence"("plannedTransactionId", "dueDate");

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedOccurrence" ADD CONSTRAINT "PlannedOccurrence_plannedTransactionId_fkey" FOREIGN KEY ("plannedTransactionId") REFERENCES "PlannedTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedOccurrence" ADD CONSTRAINT "PlannedOccurrence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
