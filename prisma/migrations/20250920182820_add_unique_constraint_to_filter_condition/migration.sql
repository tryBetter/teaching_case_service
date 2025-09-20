/*
  Warnings:

  - A unique constraint covering the columns `[name,typeId]` on the table `FilterCondition` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FilterCondition_name_typeId_key" ON "public"."FilterCondition"("name", "typeId");
