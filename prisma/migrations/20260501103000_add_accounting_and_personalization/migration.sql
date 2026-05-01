-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('expense', 'income', 'adjustment');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('manual');

-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('woman', 'man', 'nonbinary', 'self_describe', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "PronounPreference" AS ENUM ('she_her', 'he_him', 'they_them', 'name_only', 'self_describe', 'prefer_not_to_say');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'expense_recorded';
ALTER TYPE "AuditAction" ADD VALUE 'home_location_saved';
ALTER TYPE "AuditAction" ADD VALUE 'personalization_updated';

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "accountId" TEXT,
    "budgetCategoryId" TEXT,
    "type" "TransactionType" NOT NULL DEFAULT 'expense',
    "source" "TransactionSource" NOT NULL DEFAULT 'manual',
    "merchantName" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceHomeLocation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user_selected',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceHomeLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPersonalizationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genderIdentity" "GenderIdentity",
    "genderSelfDescription" TEXT,
    "pronouns" "PronounPreference",
    "pronounSelfDescription" TEXT,
    "communicationStyle" TEXT,
    "coachingIntensity" TEXT,
    "consentedAt" TIMESTAMP(3),
    "privacyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPersonalizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserJobPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleInterests" TEXT[],
    "certifications" TEXT[],
    "licenseTypes" TEXT[],
    "careWorkInterest" BOOLEAN NOT NULL DEFAULT false,
    "childCareInterest" BOOLEAN NOT NULL DEFAULT false,
    "petCareInterest" BOOLEAN NOT NULL DEFAULT false,
    "nursingInterest" BOOLEAN NOT NULL DEFAULT false,
    "teachingInterest" BOOLEAN NOT NULL DEFAULT false,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJobPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialTransaction_workspaceId_occurredAt_idx" ON "FinancialTransaction"("workspaceId", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_workspaceId_budgetCategoryId_occurredA_idx" ON "FinancialTransaction"("workspaceId", "budgetCategoryId", "occurredAt");

-- CreateIndex
CREATE INDEX "WorkspaceHomeLocation_countryCode_stateCode_city_idx" ON "WorkspaceHomeLocation"("countryCode", "stateCode", "city");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceHomeLocation_workspaceId_city_stateCode_countryCod_key" ON "WorkspaceHomeLocation"("workspaceId", "city", "stateCode", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserPersonalizationProfile_userId_key" ON "UserPersonalizationProfile"("userId");

-- CreateIndex
CREATE INDEX "UserJobPreference_userId_notificationEnabled_idx" ON "UserJobPreference"("userId", "notificationEnabled");

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceHomeLocation" ADD CONSTRAINT "WorkspaceHomeLocation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPersonalizationProfile" ADD CONSTRAINT "UserPersonalizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJobPreference" ADD CONSTRAINT "UserJobPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;