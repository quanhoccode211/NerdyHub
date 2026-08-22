
-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "examId" TEXT,
ALTER COLUMN "paperId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Favorite_examId_idx" ON "Favorite"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_examId_key" ON "Favorite"("userId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_guestId_examId_key" ON "Favorite"("guestId", "examId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

