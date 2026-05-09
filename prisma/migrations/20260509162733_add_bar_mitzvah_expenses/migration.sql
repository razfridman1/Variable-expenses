-- CreateEnum
CREATE TYPE "BarMitzvahCategory" AS ENUM (
  'HALL',
  'CATERING',
  'PHOTOGRAPHY',
  'MUSIC',
  'INVITATIONS',
  'CLOTHING',
  'GIFTS',
  'FLOWERS',
  'DECORATIONS',
  'TRANSPORTATION',
  'RABBI',
  'OTHER'
);

-- CreateTable
CREATE TABLE "bar_mitzvah_expenses" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" "BarMitzvahCategory" NOT NULL,
    "customCategory" TEXT,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amountRemaining" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_mitzvah_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_mitzvah_expenses_userId_paymentDate_idx" ON "bar_mitzvah_expenses"("userId", "paymentDate");

-- CreateIndex
CREATE INDEX "bar_mitzvah_expenses_userId_category_idx" ON "bar_mitzvah_expenses"("userId", "category");

-- AddForeignKey
ALTER TABLE "bar_mitzvah_expenses" ADD CONSTRAINT "bar_mitzvah_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
