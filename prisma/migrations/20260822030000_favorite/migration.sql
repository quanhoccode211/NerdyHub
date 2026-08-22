
-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "paperId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_paperId_idx" ON "Favorite"("paperId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_paperId_key" ON "Favorite"("userId", "paperId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_guestId_paperId_key" ON "Favorite"("guestId", "paperId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "TestPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

