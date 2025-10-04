-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE';
