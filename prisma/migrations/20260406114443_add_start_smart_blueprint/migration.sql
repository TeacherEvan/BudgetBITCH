-- CreateEnum
CREATE TYPE "StartSmartStatus" AS ENUM ('draft', 'generated', 'accepted');

-- CreateEnum
CREATE TYPE "ConfidenceLabel" AS ENUM ('verified', 'estimated', 'user_entered');

-- CreateTable
CREATE TABLE "StartSmartProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "templateId" TEXT,
    "regionKey" TEXT NOT NULL,
    "householdKind" TEXT NOT NULL,
    "status" "StartSmartStatus" NOT NULL DEFAULT 'draft',
    "profileJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartSmartProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "confidence" "ConfidenceLabel" NOT NULL DEFAULT 'estimated',
    "assumptionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyBlueprintSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "householdKind" TEXT NOT NULL,
    "status" "StartSmartStatus" NOT NULL DEFAULT 'generated',
    "blueprintJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyBlueprintSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StartSmartProfile_workspaceId_status_idx" ON "StartSmartProfile"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "StartSmartProfile_regionKey_idx" ON "StartSmartProfile"("regionKey");

-- CreateIndex
CREATE INDEX "RegionalSnapshot_workspaceId_regionKey_idx" ON "RegionalSnapshot"("workspaceId", "regionKey");

-- CreateIndex
CREATE INDEX "MoneyBlueprintSnapshot_workspaceId_status_idx" ON "MoneyBlueprintSnapshot"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "MoneyBlueprintSnapshot_regionKey_idx" ON "MoneyBlueprintSnapshot"("regionKey");

-- AddForeignKey
ALTER TABLE "StartSmartProfile" ADD CONSTRAINT "StartSmartProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalSnapshot" ADD CONSTRAINT "RegionalSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalSnapshot" ADD CONSTRAINT "RegionalSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StartSmartProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyBlueprintSnapshot" ADD CONSTRAINT "MoneyBlueprintSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyBlueprintSnapshot" ADD CONSTRAINT "MoneyBlueprintSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StartSmartProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
