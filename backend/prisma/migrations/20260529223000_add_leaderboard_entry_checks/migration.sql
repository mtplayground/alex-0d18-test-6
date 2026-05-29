-- Add database-level guards for leaderboard values that are validated by the service.
ALTER TABLE "LeaderboardEntry"
ADD CONSTRAINT "LeaderboardEntry_score_nonnegative" CHECK ("score" >= 0),
ADD CONSTRAINT "LeaderboardEntry_highestLevel_range" CHECK ("highestLevel" BETWEEN 1 AND 3),
ADD CONSTRAINT "LeaderboardEntry_durationMs_nonnegative" CHECK ("durationMs" >= 0);
