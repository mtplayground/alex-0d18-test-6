-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "nickname" VARCHAR(16) NOT NULL,
    "score" INTEGER NOT NULL,
    "highestLevel" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_score_createdAt_idx" ON "LeaderboardEntry"("score" DESC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_highestLevel_score_createdAt_idx" ON "LeaderboardEntry"("highestLevel", "score" DESC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_ipAddress_createdAt_idx" ON "LeaderboardEntry"("ipAddress", "createdAt");
