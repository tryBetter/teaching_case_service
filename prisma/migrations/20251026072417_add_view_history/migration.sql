-- CreateTable
CREATE TABLE "public"."ViewHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "ViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewHistory_userId_createdAt_idx" ON "public"."ViewHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ViewHistory_userId_articleId_key" ON "public"."ViewHistory"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "public"."ViewHistory" ADD CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewHistory" ADD CONSTRAINT "ViewHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
