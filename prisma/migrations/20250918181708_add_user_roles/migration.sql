-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('TEACHER', 'ASSISTANT', 'STUDENT');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT';
