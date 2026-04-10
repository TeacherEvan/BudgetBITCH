-- CreateEnum
CREATE TYPE "DailyCheckInStatus" AS ENUM ('completed', 'skipped');

-- CreateEnum
CREATE TYPE "DailyCheckInAlertStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "DailyCheckInAlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "ProjectionTopic" AS ENUM ('daily_check_in', 'daily_check_in_alert');

-- CreateEnum
CREATE TYPE "ProjectionOutboxStatus" AS ENUM ('pending', 'processing', 'failed', 'succeeded');

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "checkInDate" DATE NOT NULL,
    "status" "DailyCheckInStatus" NOT NULL DEFAULT 'completed',
    "checkInJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckInAlert" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "status" "DailyCheckInAlertStatus" NOT NULL DEFAULT 'open',
    "severity" "DailyCheckInAlertSeverity" NOT NULL DEFAULT 'info',
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DailyCheckInAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectionOutbox" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "topic" "ProjectionTopic" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "ProjectionOutboxStatus" NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectionOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceUserPreference" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceUserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_workspaceId_checkInDate_key" ON "DailyCheckIn"("workspaceId", "checkInDate");

-- CreateIndex
CREATE INDEX "DailyCheckIn_actorUserId_checkInDate_idx" ON "DailyCheckIn"("actorUserId", "checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckInAlert_checkInId_code_key" ON "DailyCheckInAlert"("checkInId", "code");

-- CreateIndex
CREATE INDEX "DailyCheckInAlert_checkInId_status_idx" ON "DailyCheckInAlert"("checkInId", "status");

-- CreateIndex
CREATE INDEX "DailyCheckInAlert_workspaceId_status_severity_idx" ON "DailyCheckInAlert"("workspaceId", "status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionOutbox_dedupeKey_key" ON "ProjectionOutbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "ProjectionOutbox_status_availableAt_idx" ON "ProjectionOutbox"("status", "availableAt");

-- CreateIndex
CREATE INDEX "ProjectionOutbox_workspaceId_status_availableAt_idx" ON "ProjectionOutbox"("workspaceId", "status", "availableAt");

-- CreateIndex
CREATE INDEX "ProjectionOutbox_topic_sourceId_idx" ON "ProjectionOutbox"("topic", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceUserPreference_workspaceId_userId_key" ON "WorkspaceUserPreference"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "WorkspaceUserPreference_userId_isDefault_lastOpenedAt_idx" ON "WorkspaceUserPreference"("userId", "isDefault", "lastOpenedAt");

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckInAlert" ADD CONSTRAINT "DailyCheckInAlert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckInAlert" ADD CONSTRAINT "DailyCheckInAlert_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "DailyCheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectionOutbox" ADD CONSTRAINT "ProjectionOutbox_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceUserPreference" ADD CONSTRAINT "WorkspaceUserPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceUserPreference" ADD CONSTRAINT "WorkspaceUserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
