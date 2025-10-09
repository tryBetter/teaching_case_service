-- AlterTable
ALTER TABLE "public"."Media" ADD COLUMN     "uploaderId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
