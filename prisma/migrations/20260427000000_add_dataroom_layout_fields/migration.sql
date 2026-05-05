-- CreateEnum
CREATE TYPE "DataroomLogoPosition" AS ENUM ('TOP_LEFT', 'TOP_CENTER', 'SPLIT');

-- CreateEnum
CREATE TYPE "DataroomCardLayout" AS ENUM ('GRID', 'LIST', 'COMPACT');

-- CreateEnum
CREATE TYPE "DataroomRoundness" AS ENUM ('NONE', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "DataroomBrand"
ADD COLUMN "secondaryLogo" TEXT,
ADD COLUMN "logoPosition" "DataroomLogoPosition" NOT NULL DEFAULT 'TOP_LEFT',
ADD COLUMN "cardLayout" "DataroomCardLayout" NOT NULL DEFAULT 'LIST',
ADD COLUMN "roundness" "DataroomRoundness" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "sidebarEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sidebarContent" TEXT,
ADD COLUMN "ctaLabel" TEXT,
ADD COLUMN "ctaUrl" TEXT;
