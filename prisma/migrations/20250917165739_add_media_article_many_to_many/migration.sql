/*
  Warnings:

  - You are about to drop the column `articleId` on the `Media` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Media" DROP CONSTRAINT "Media_articleId_fkey";

-- AlterTable
ALTER TABLE "public"."Media" DROP COLUMN "articleId";

-- CreateTable
CREATE TABLE "public"."ArticleMedia" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleMedia_articleId_mediaId_key" ON "public"."ArticleMedia"("articleId", "mediaId");

-- AddForeignKey
ALTER TABLE "public"."ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleMedia" ADD CONSTRAINT "ArticleMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
