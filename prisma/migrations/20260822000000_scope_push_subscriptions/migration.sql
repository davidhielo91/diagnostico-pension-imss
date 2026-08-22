-- Additive rollout for per-user browser push subscriptions.
ALTER TABLE "PushSubscription" ADD COLUMN "userId" TEXT;

-- Preserve legacy subscriptions by assigning them deterministically to the first active administrator.
-- If no active administrator exists, the row stays unassigned and is intentionally never broadcast.
UPDATE "PushSubscription"
SET "userId" = (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'administrador' AND "active" = true
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");
CREATE INDEX "LeadStatusHistory_leadId_idx" ON "LeadStatusHistory"("leadId");
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "PushSubscription"
ADD CONSTRAINT "PushSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback after application rollback: drop this FK and the four indexes, then drop
-- "userId" only after confirming no deployed application version still writes it.
