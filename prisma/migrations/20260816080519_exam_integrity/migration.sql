-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestId" TEXT,
    "paperId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "audioPlayedSectionIdsJson" TEXT NOT NULL DEFAULT '[]',
    "rawScore" REAL,
    "scaledScore" REAL,
    "percentile" REAL,
    "sectionScoresJson" TEXT,
    "currentSectionId" TEXT,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attempt_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "TestPaper" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attempt" ("currentSectionId", "expiresAt", "guestId", "id", "lastSyncAt", "mode", "paperId", "percentile", "rawScore", "scaledScore", "sectionScoresJson", "startedAt", "status", "submittedAt", "timeSpent", "userId") SELECT "currentSectionId", "expiresAt", "guestId", "id", "lastSyncAt", "mode", "paperId", "percentile", "rawScore", "scaledScore", "sectionScoresJson", "startedAt", "status", "submittedAt", "timeSpent", "userId" FROM "Attempt";
DROP TABLE "Attempt";
ALTER TABLE "new_Attempt" RENAME TO "Attempt";
CREATE INDEX "Attempt_userId_submittedAt_idx" ON "Attempt"("userId", "submittedAt");
CREATE INDEX "Attempt_guestId_idx" ON "Attempt"("guestId");
CREATE INDEX "Attempt_paperId_scaledScore_idx" ON "Attempt"("paperId", "scaledScore");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
